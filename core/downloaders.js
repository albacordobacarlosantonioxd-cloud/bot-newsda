const resultKeys = ['result', 'data', 'results', 'items', 'videos', 'tracks', 'songs', 'resultados']
const urlKeys = ['url', 'videoUrl', 'video_url', 'watchUrl', 'watch_url', 'webpage_url', 'spotifyUrl', 'spotify_url', 'trackUrl', 'track_url', 'link', 'permalink']

function parseUrl(value, allowedHosts) {
    if (typeof value !== 'string' || !value.trim()) return null
    let url
    try {
        url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    } catch {
        return null
    }
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (allowedHosts && !allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return null
    return url.toString()
}

export function isYouTubeUrl(value) {
    return Boolean(parseUrl(value, ['youtube.com', 'youtu.be', 'youtube-nocookie.com']))
}

export function normalizeYouTubeUrl(value) {
    return parseUrl(value, ['youtube.com', 'youtu.be', 'youtube-nocookie.com'])
}

export function normalizePinterestUrl(value) {
    return parseUrl(value, ['pinterest.com', 'pin.it'])
}

export function isSpotifyUrl(value) {
    return Boolean(parseUrl(value, ['spotify.com', 'spotify.link']))
}

export function normalizeSpotifyUrl(value) {
    return parseUrl(value, ['spotify.com', 'spotify.link'])
}

export function extractFirstSearchResult(payload) {
    const queue = [payload]
    const visited = new Set()

    while (queue.length) {
        const value = queue.shift()
        if (!value || typeof value !== 'object' || visited.has(value)) continue
        visited.add(value)

        if (Array.isArray(value)) {
            queue.push(...value)
            continue
        }

        const hasResultUrl = urlKeys.some(key => typeof value[key] === 'string')
        const hasTitle = ['title', 'name', 'track', 'song', 'artist', 'author'].some(key => Boolean(value[key]))
        const hasVideoId = typeof value.videoId === 'string' || (hasTitle && typeof value.id === 'string')
        if ((hasResultUrl && hasTitle) || hasVideoId) return value

        for (const key of resultKeys) {
            if (value[key] !== undefined) queue.push(value[key])
        }
    }

    return null
}

export function extractYouTubeUrl(item) {
    if (typeof item === 'string') return normalizeYouTubeUrl(item)
    if (!item || typeof item !== 'object') return null

    for (const key of ['url', 'videoUrl', 'video_url', 'watchUrl', 'watch_url', 'webpage_url', 'link']) {
        const url = normalizeYouTubeUrl(item[key])
        if (!url) continue

        const videoId = extractYouTubeVideoId(url)
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
    }

    const videoId = item.videoId || (typeof item.id === 'string' ? item.id : item.id?.videoId)
    if (typeof videoId === 'string' && /^[\w-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/watch?v=${videoId}`
    }

    const thumbnailUrl = getMediaThumbnail(item)
    const thumbnailId = typeof thumbnailUrl === 'string'
        ? thumbnailUrl.match(/\/vi(?:_webp)?\/([\w-]{11})\//)?.[1]
        : null
    if (thumbnailId) return `https://www.youtube.com/watch?v=${thumbnailId}`

    return null
}

function extractYouTubeVideoId(value) {
    let url
    try {
        url = new URL(value)
    } catch {
        return null
    }

    const host = url.hostname.toLowerCase()
    let videoId = null
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
        videoId = url.pathname.split('/').filter(Boolean)[0]
    } else if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v')
    } else {
        videoId = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1]
    }

    return typeof videoId === 'string' && /^[\w-]{11}$/.test(videoId) ? videoId : null
}

export function extractSpotifyUrl(item) {
    if (typeof item === 'string') return normalizeSpotifyUrl(item)
    if (!item || typeof item !== 'object') return null

    for (const key of ['spotifyUrl', 'spotify_url', 'trackUrl', 'track_url', 'url', 'link', 'permalink']) {
        const url = normalizeSpotifyUrl(item[key])
        if (url) return url
    }
    if (typeof item.id === 'string' && /^[\w]{22}$/.test(item.id)) {
        return `https://open.spotify.com/track/${item.id}`
    }
    return null
}

function firstValue(item, keys) {
    for (const key of keys) {
        const value = item?.[key]
        if (value !== undefined && value !== null && value !== '') return value
    }
    return null
}

export function getMediaThumbnail(item) {
    const value = firstValue(item, ['imageHD', 'imageHd', 'thumbnail', 'thumbnails', 'thumbnailUrl', 'thumbnail_url', 'image', 'imageUrl', 'image_url', 'banner', 'cover'])
    if (typeof value === 'string') return /^https?:\/\//i.test(value) ? value : null
    if (Array.isArray(value)) {
        const thumbnail = value.find(entry => typeof entry === 'string' || entry?.url || entry?.src)
        return typeof thumbnail === 'string' ? thumbnail : thumbnail?.url || thumbnail?.src || null
    }
    return value?.url || value?.src || null
}

export function getMediaDurationSeconds(item) {
    const durationKeys = ['durationSeconds', 'duration_seconds', 'seconds', 'duration', 'durationText', 'length', 'timestamp', 'time']

    for (let value of durationKeys.map(key => item?.[key])) {
        if (value && typeof value === 'object') value = value.seconds ?? value.totalSeconds ?? value.timestamp

        if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value)
        if (typeof value !== 'string') continue

        const duration = value.trim()
        if (!duration) continue
        const numericDuration = Number(duration)
        if (Number.isFinite(numericDuration) && numericDuration > 0) return Math.round(numericDuration)

        if (/^\d+(?::\d{1,2}){1,2}$/.test(duration)) {
            const total = duration.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0)
            if (total > 0) return total
        }

        const unitDuration = duration.match(/^(?:(\d+(?:\.\d+)?)\s*h\s*)?(?:(\d+(?:\.\d+)?)\s*m\s*)?(?:(\d+(?:\.\d+)?)\s*s)?$/i)
        if (unitDuration && unitDuration.slice(1).some(Boolean)) {
            const [, hours = 0, minutes = 0, seconds = 0] = unitDuration
            const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
            if (total > 0) return Math.round(total)
        }
    }

    return undefined
}

function displayValue(value, fallback = 'No disponible') {
    if (value === undefined || value === null || value === '') return fallback
    if (Array.isArray(value)) return value.map(entry => displayValue(entry, '')).filter(Boolean).join(', ') || fallback
    if (typeof value === 'object') return value.text || value.label || value.name || fallback
    return String(value)
}

export function formatMediaDetails(item, platform = 'YouTube') {
    const title = firstValue(item, ['title', 'name', 'track', 'song'])
    const artist = firstValue(item, ['author', 'autor', 'artist', 'artists', 'channel', 'channelTitle', 'uploader', 'creator', 'owner'])
    const duration = firstValue(item, ['duration', 'durationText', 'length', 'timestamp', 'time'])
    const album = firstValue(item, ['album', 'albumName'])
    const lines = [
        platform,
        `Título: ${displayValue(title, 'Sin título')}`,
        `Autor: ${displayValue(artist)}`,
        `Duración: ${displayValue(duration)}`
    ]
    if (album !== null) lines.push(`Álbum: ${displayValue(album)}`)
    const likes = firstValue(item, ['likes', 'like', 'likeCount', 'like_count'])
    const views = firstValue(item, ['views', 'viewCount', 'view_count', 'plays', 'playCount'])
    const published = firstValue(item, ['publishedTime', 'publishedAt', 'published', 'uploadDate', 'publishDate', 'emission', 'emision', 'date'])
    if (platform.toLowerCase().includes('youtube')) {
        lines.push(`Me gusta: ${displayValue(likes)}`)
        lines.push(`Reproducciones: ${displayValue(views)}`)
        lines.push(`Emisión: ${displayValue(published)}`)
    }
    return lines.join('\n')
}

export function safeMediaFilename(value, fallback) {
    const name = String(value || fallback)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120)
    return name || fallback
}

export async function sendMediaDetails(conn, m, item, platform) {
    const text = formatMediaDetails(item, platform)
    const thumbnail = getMediaThumbnail(item)
    if (thumbnail) {
        await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption: text }, { quoted: m })
    } else {
        await conn.sendMessage(m.chat, { text }, { quoted: m })
    }
}