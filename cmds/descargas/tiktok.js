import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`📥 Ingresa el enlace del TikTok.\nEjemplo: ${usedPrefix + command} https://www.tiktok.com/...`)

    const endpoint = command === 'tiktokv2' || command === 'tt2' ? '/dl/tiktokv2' : '/dl/tiktok'
    try {
        const data = await evoGet(endpoint, { url: query })
        if (!apiSucceeded(data)) return m.reply('⚠️ No se pudo descargar ese TikTok.')

        const video = extractMediaItem(data)
        const videoUrl = extractMediaUrl(data)
        if (!videoUrl) return m.reply('⚠️ La API no devolvió un enlace de video.')

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: `🎬 *TikTok*\n${video.title || video.description || ''}`,
            mimetype: video.mimetype || 'video/mp4'
        }, { quoted: m })
    } catch (e) {
        console.error(e.message)
        return m.reply('⚠️ Error al conectar con Evo para descargar TikTok.')
    }
}

handler.help = ['tiktok <enlace>', 'tiktokv2 <enlace>']
handler.tags = ['descargas']
handler.command = ['tiktok', 'tt', 'tk', 'tiktokv2', 'tt2']

export default handler