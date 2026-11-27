import { apiSucceeded, evoGet } from '../../core/evogb.js'
import { extractFirstSearchResult, extractYouTubeUrl, formatMediaDetails, getMediaThumbnail } from '../../core/downloaders.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = String(text || m.quoted?.text || '').trim()
    if (!query) return m.reply(`Escribe lo que deseas buscar.\nEjemplo: ${usedPrefix + command} Lupita`)

    try {
        const data = await evoGet('/search/yt', { query })
        if (!apiSucceeded(data)) return m.reply('No se encontraron resultados de YouTube.')

        const firstResult = extractFirstSearchResult(data)
        if (!firstResult) return m.reply('No se encontraron resultados de YouTube.')
        const results = Array.isArray(data.result) ? data.result : Array.isArray(data.data) ? data.data : [firstResult]
        const lines = results.slice(0, 6).map((video, index) => {
            const url = extractYouTubeUrl(video) || 'Enlace no disponible'
            return `${index + 1}. ${formatMediaDetails(video, 'YouTube')}\nURL: ${url}`
        })
        const caption = `Resultados de YouTube\n\n${lines[0]}`
        const imageUrl = getMediaThumbnail(firstResult)
        if (imageUrl) {
            await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
            if (lines.length > 1) {
                await conn.sendMessage(m.chat, { text: `Más resultados\n\n${lines.slice(1).join('\n\n')}` }, { quoted: m })
            }
        } else {
            await conn.sendMessage(m.chat, { text: `Resultados de YouTube\n\n${lines.join('\n\n')}` }, { quoted: m })
        }
    } catch (error) {
        console.error('[YTSEARCH]', error.message)
        return m.reply('No se pudo conectar con la búsqueda de YouTube.')
    }
}

handler.help = ['ytsearch <búsqueda>']
handler.tags = ['herramientas']
handler.command = ['ytsearch', 'yts', 'youtube', 'yt']

export default handler
