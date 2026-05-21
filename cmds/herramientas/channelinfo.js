import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    const stellarKey = 'api-wXCo4'
    if (!text || !text.includes('whatsapp.com/channel/')) return m.reply('✨ *Ingresa el enlace del canal.*')

    await m.react('🔍')
    try {
        const apiUrl = `https://api.stellarwa.xyz/tools/newsletter?url=${encodeURIComponent(text)}&key=${stellarKey}`
        const res = await axios.get(apiUrl)
        if (!res.data.status) throw new Error('No se pudo obtener la información.')

        const info = res.data.result
        let txt = `📢 *INFO DE CANAL*\n\n`
        txt += `📝 *Nombre:* ${info.title}\n`
        txt += `👥 *Seguidores:* ${info.followers}\n`
        txt += `📄 *Descripción:* ${info.description}\n`

        if (info.image) {
            await conn.sendMessage(m.chat, { image: { url: info.image }, caption: txt }, { quoted: m })
        } else {
            await m.reply(txt)
        }
        await m.react('✅')
    } catch (e) {
        m.reply('⚠️ *Error:* Enlace inválido o API caída.')
    }
}
handler.command = ['channelinfo', 'infocanal']
export default handler
