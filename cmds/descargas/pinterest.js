import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'
import { normalizePinterestUrl } from '../../core/downloaders.js'

const pinCache = new Map()
const pinCacheTtlMs = 30 * 60 * 1000
const maxCachedPins = 200

function extractPinterestItems(payload) {
    const queue = [payload]
    const visited = new Set()

    while (queue.length) {
        const value = queue.shift()
        if (!value || typeof value !== 'object' || visited.has(value)) continue
        visited.add(value)

        if (Array.isArray(value)) {
            if (value.length) return value
            continue
        }

        for (const key of ['data', 'result', 'results', 'items', 'response', 'pins']) {
            if (value[key] !== undefined) queue.push(value[key])
        }
    }

    return []
}

function getPinterestMedia(item) {
    const videoValue = item?.media?.video || item?.video
    const videoList = videoValue?.video_list || videoValue?.videoList || {}
    const videoVariants = Object.values(videoList).filter(value => value && typeof value === 'object')
    const videoUrl = typeof videoValue === 'string'
        ? videoValue
        : videoValue?.url || item?.videoUrl || item?.video_url || videoVariants.find(value => /\.mp4(?:\?|$)/i.test(value.url || ''))?.url
    const usableVideoUrl = videoUrl && !/\.(?:m3u8|mpd)(?:\?|$)/i.test(videoUrl) ? videoUrl : null
    const imageUrl = item?.hd
        || item?.media?.images?.orig?.url
        || item?.media?.images?.large?.url
        || item?.media?.images?.medium?.url
        || item?.imageHD
        || item?.imageUrl
        || item?.image_url
        || item?.image?.url
        || videoVariants.find(value => value.thumbnail)?.thumbnail
        || videoValue?.thumbnail
    const candidateUrl = usableVideoUrl || imageUrl
    if (typeof candidateUrl !== 'string') return null
    const url = /^https?:\/\//i.test(candidateUrl)
        ? candidateUrl
        : /^([\w.-]+\.pinimg\.com)\//i.test(candidateUrl) ? `https://${candidateUrl}` : null
    if (!url) return null

    const type = `${videoValue?.type || item?.type || item?.mimetype || item?.mimeType || ''}`.toLowerCase()
    const isVideo = Boolean(usableVideoUrl) || /video/i.test(type) && !imageUrl || /\.(mp4|mov|webm)(?:\?|$)/i.test(url)
    return { url, isVideo }
}

function getDirectPinMediaUrl(value) {
    let url
    try {
        url = new URL(value)
    } catch {
        return null
    }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.toLowerCase().endsWith('.pinimg.com')) return null
    if (!/\.(?:jpe?g|png|webp|gif|mp4|mov|webm)$/i.test(url.pathname)) return null
    return url.toString()
}

function getPinUrl(item) {
    const value = item?.pin_url || item?.pinUrl
    if (value) return normalizePinterestUrl(value)
    if (typeof item?.id === 'string' && item.id.trim()) {
        return normalizePinterestUrl(`https://www.pinterest.com/pin/${encodeURIComponent(item.id.trim())}/`)
    }
    return null
}

function getPinCacheKey(value) {
    const normalized = normalizePinterestUrl(value)
    if (!normalized) return null
    const url = new URL(normalized)
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    url.search = ''
    url.hash = ''
    return `${url.hostname}${url.pathname.replace(/\/+$/, '')}`
}

function rememberPin(item, media) {
    const pinUrl = getPinUrl(item)
    const key = pinUrl && getPinCacheKey(pinUrl)
    if (!key) return pinUrl

    pinCache.set(key, { item, media, timestamp: Date.now() })
    while (pinCache.size > maxCachedPins) pinCache.delete(pinCache.keys().next().value)
    return pinUrl
}

async function sendPinterestMedia(conn, m, item, media, pinUrl = getPinUrl(item)) {
    const title = item?.title || item?.description || ''
    const caption = [typeof title === 'string' ? title.trim().slice(0, 400) : '', pinUrl || '']
        .filter(Boolean)
        .join('\n')
        .slice(0, 800)
    await conn.sendMessage(m.chat, {
        [media.isVideo ? 'video' : 'image']: { url: media.url },
        ...(caption ? { caption } : {})
    }, { quoted: m })
}

var handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = String(text || m.quoted?.text || '').trim()
    if (!query) return m.reply(`Escribe una búsqueda o pega un enlace de Pinterest.\nEjemplo: ${usedPrefix + command} paisaje`)

    const pinterestUrl = normalizePinterestUrl(query)
    const directMediaUrl = getDirectPinMediaUrl(query)
    if (directMediaUrl) {
        const isVideo = /\.(mp4|mov|webm)$/i.test(new URL(directMediaUrl).pathname)
        return sendPinterestMedia(conn, m, {}, { url: directMediaUrl, isVideo })
    }

    if (pinterestUrl) {
        const cacheKey = getPinCacheKey(pinterestUrl)
        const cached = cacheKey ? pinCache.get(cacheKey) : null
        if (cached && Date.now() - cached.timestamp < pinCacheTtlMs) {
            return sendPinterestMedia(conn, m, cached.item, cached.media, pinterestUrl)
        }
        if (cached) pinCache.delete(cacheKey)

        try {
            const data = await evoGet('/dl/pinterest', { url: pinterestUrl })
            if (!apiSucceeded(data)) return m.reply('Evo no encontró contenido descargable para ese pin.')

            const item = extractMediaItem(data)
            const media = getPinterestMedia(item) || (() => {
                const url = extractMediaUrl(data)
                if (!url) return null
                const type = `${item.type || item.mimetype || item.mimeType || ''}`.toLowerCase()
                return { url, isVideo: /video/i.test(type) || /\.(mp4|mov|webm)(?:\?|$)/i.test(url) }
            })()
            if (!media) return m.reply('Evo no devolvió un archivo descargable para ese pin.')

            return sendPinterestMedia(conn, m, item, media)
        } catch (error) {
            console.error('[PINTEREST DOWNLOAD]', error.message)
            return m.reply('Evo no encontró contenido descargable para ese pin. Prueba con otro enlace.')
        }
    }

    try {
        let data
        try {
            data = await evoGet('/search/pinterest', { query })
        } catch (error) {
            console.error('[PINTEREST SEARCH V1]', error.message)
        }
        let items = apiSucceeded(data) ? extractPinterestItems(data).filter(item => getPinterestMedia(item)) : []

        if (!items.length) {
            data = await evoGet('/search/pinterestv2', { query }, { includeApiKey: false })
            items = apiSucceeded(data) ? extractPinterestItems(data).filter(item => getPinterestMedia(item)) : []
        }
        if (!items.length) return m.reply('No se encontraron imágenes o videos en Pinterest.')

        for (const item of items.slice(0, 5)) {
            const media = getPinterestMedia(item)
            const pinUrl = rememberPin(item, media)
            await sendPinterestMedia(conn, m, item, media, pinUrl)
        }
    } catch (error) {
        console.error('[PINTEREST SEARCH]', error.message)
        return m.reply('No se pudo completar la búsqueda de Pinterest.')
    }
}

handler.help = ['pinterest', 'pin']
handler.tags = ['descargas', 'search']
handler.command = ['pinterest', 'pin', 'pinter']

export default handler
