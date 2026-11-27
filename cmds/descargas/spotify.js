import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'
import { extractFirstSearchResult, extractSpotifyUrl, formatMediaDetails, getMediaDurationSeconds, getMediaThumbnail, normalizeSpotifyUrl, safeMediaFilename } from '../../core/downloaders.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = String(text || m.quoted?.text || '').trim()
    if (!query) return m.reply(`Escribe una búsqueda o un enlace de Spotify.\nEjemplo: ${usedPrefix + command} Mask Off`)

    try {
        let trackUrl = normalizeSpotifyUrl(query)
        let searchItem = null
        if (!trackUrl) {
            trackUrl = query
            const searchData = await evoGet('/search/spotify', { query })
            if (!apiSucceeded(searchData)) return m.reply('No se encontraron resultados de Spotify.')
            searchItem = extractFirstSearchResult(searchData)
            trackUrl = extractSpotifyUrl(searchItem)
            if (!trackUrl) return m.reply('El primer resultado no incluyó un enlace válido de Spotify.')
        }

        const dlData = await evoGet('/dl/spotify', { url: trackUrl })
        if (!apiSucceeded(dlData)) return m.reply('Evo no pudo descargar la canción de Spotify.')

        const info = extractMediaItem(dlData)
        const audioUrl = extractMediaUrl(dlData)
        if (!audioUrl) return m.reply('La API no devolvió un enlace de audio.')

        const details = { ...(searchItem || {}), ...info }
        const caption = formatMediaDetails(details, 'Spotify')
        const imageUrl = getMediaThumbnail(details)
        if (imageUrl) await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
        else await conn.sendMessage(m.chat, { text: caption }, { quoted: m })

        const title = safeMediaFilename(details.title || details.name, 'spotify-track')
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: info.mimetype || info.mimeType || 'audio/mpeg',
            fileName: `${title}.mp3`,
            ...(getMediaDurationSeconds(details) ? { seconds: getMediaDurationSeconds(details) } : {})
        }, { quoted: m })
    } catch (error) {
        console.error('[SPOTIFY]', error.message)
        if (/Evo respondió con HTTP 5\d{2}/.test(error.message)) {
            return m.reply(`El servidor de Spotify de Evo está fallando (${error.message}). Inténtalo más tarde.`)
        }
        return m.reply('No se pudo completar la descarga de Spotify.')
    }
}

handler.help = ['spotify <búsqueda o URL>']
handler.tags = ['descargas']
handler.command = ['spotify', 'sp', 'music', 'spt']

export default handler
