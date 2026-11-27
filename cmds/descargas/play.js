import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'
import { getMediaDurationSeconds, normalizeYouTubeUrl, safeMediaFilename, sendMediaDetails } from '../../core/downloaders.js'

const VIDEO_QUALITY = '480'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = String(text || m.quoted?.text || '').trim()
    if (!query) return m.reply(`Escribe una búsqueda o un enlace de YouTube.\nEjemplo: ${usedPrefix + command} Que Loke`)

    const isVideo = command === 'play2'
    try {
        const params = { query: normalizeYouTubeUrl(query) || query, type: isVideo ? 'video' : 'audio' }
        if (isVideo) params.quality = VIDEO_QUALITY
        const data = await evoGet('/dl/youtubeplay', params, { apiKeyHeader: true })
        if (!apiSucceeded(data)) return m.reply('Evo no pudo procesar la solicitud de YouTube.')

        const media = extractMediaItem(data)
        const mediaUrl = extractMediaUrl(data)
        if (!mediaUrl) return m.reply(`La API no devolvió un enlace de ${isVideo ? 'video' : 'audio'}.`)

        await sendMediaDetails(conn, m, media, isVideo ? 'YouTube Video' : 'YouTube Audio')
        const title = safeMediaFilename(media.title || media.name, isVideo ? 'youtube-video' : 'youtube-audio')
        if (isVideo) {
            await conn.sendMessage(m.chat, {
                video: { url: mediaUrl },
                mimetype: media.mimetype || media.mimeType || 'video/mp4',
                fileName: `${title}.mp4`
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                audio: { url: mediaUrl },
                mimetype: media.mimetype || media.mimeType || 'audio/mpeg',
                fileName: `${title}.mp3`,
                ...(getMediaDurationSeconds(media) ? { seconds: getMediaDurationSeconds(media) } : {})
            }, { quoted: m })
        }
    } catch (error) {
        console.error(`[${command.toUpperCase()}]`, error.message)
        return m.reply('No se pudo completar la solicitud de YouTube.')
    }
}

handler.help = ['play <búsqueda o URL>', 'play2 <búsqueda o URL>']
handler.tags = ['descargas']
handler.command = ['play', 'play2']

export default handler