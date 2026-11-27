import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'
import {
    extractFirstSearchResult,
    extractYouTubeUrl,
    formatMediaDetails,
    getMediaDurationSeconds,
    getMediaThumbnail,
    normalizeYouTubeUrl,
    safeMediaFilename,
    sendMediaDetails
} from '../../core/downloaders.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = String(text || m.quoted?.text || '').trim()
    if (!query) return m.reply(`Escribe una búsqueda o un enlace de YouTube.\nEjemplo: ${usedPrefix + command} Que Loke`)

    try {
        let youtubeUrl = normalizeYouTubeUrl(query)
        let searchItem = null
        if (!youtubeUrl) {
            youtubeUrl = query
            const searchData = await evoGet('/search/yt', { query })
            if (!apiSucceeded(searchData)) return m.reply('No se encontraron resultados de YouTube.')
            searchItem = extractFirstSearchResult(searchData)
            youtubeUrl = extractYouTubeUrl(searchItem)
            if (!youtubeUrl) return m.reply('El primer resultado no incluyó un enlace válido de YouTube.')
        }

        const data = await evoGet('/dl/ytmp3', { url: youtubeUrl })
        if (!apiSucceeded(data)) return m.reply('Evo no pudo descargar el audio de YouTube.')

        const audio = extractMediaItem(data)
        const audioUrl = extractMediaUrl(data)
        if (!audioUrl) return m.reply('La API no devolvió un enlace de audio.')

        const details = { ...(searchItem || {}), ...audio }
        if (getMediaThumbnail(details)) {
            await conn.sendMessage(m.chat, {
                image: { url: getMediaThumbnail(details) },
                caption: formatMediaDetails(details, 'YouTube MP3')
            }, { quoted: m })
        } else {
            await sendMediaDetails(conn, m, details, 'YouTube MP3')
        }

        const title = safeMediaFilename(details.title || details.name, 'youtube-audio')
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: audio.mimetype || audio.mimeType || 'audio/mpeg',
            fileName: `${title}.mp3`,
            ...(getMediaDurationSeconds(details) ? { seconds: getMediaDurationSeconds(details) } : {})
        }, { quoted: m })
    } catch (error) {
        console.error('[YTMP3]', error.message)
        return m.reply('No se pudo completar la descarga de YouTube.')
    }
}

handler.help = ['ytmp3 <búsqueda o URL>']
handler.tags = ['descargas']
handler.command = ['ytmp3']

export default handler