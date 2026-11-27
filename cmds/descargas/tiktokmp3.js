import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`📥 Ingresa el enlace de TikTok.\nEjemplo: ${usedPrefix + command} https://www.tiktok.com/...`)

    try {
        const data = await evoGet('/dl/tiktokmp3', { url: query })
        if (!apiSucceeded(data)) return m.reply('⚠️ No se pudo extraer el audio de ese TikTok.')

        const audio = extractMediaItem(data)
        const audioUrl = extractMediaUrl(data)
        if (!audioUrl) return m.reply('⚠️ La API no devolvió un enlace de audio.')

        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: audio.mimetype || 'audio/mpeg',
            fileName: `${audio.title || 'tiktok-audio'}.mp3`
        }, { quoted: m })
    } catch (e) {
        console.error(e.message)
        return m.reply('⚠️ Error al conectar con Evo para extraer el audio.')
    }
}

handler.help = ['tiktokmp3 <enlace>']
handler.tags = ['descargas']
handler.command = ['tiktokmp3', 'ttmp3']

export default handler