import axios from 'axios'

var handler = async (m, { conn, usedPrefix, command }) => {
    const stellarKey = 'api-wXCo4'
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (!/audio/.test(mime)) return m.reply(`✨ *Responde a un audio con ${usedPrefix + command}*`)

    await m.react('⏳')
    try {
        let media = await q.download()
        let { uploadByBuffer } = await import('../../lib/uploadFile.js') 
        let link = await uploadByBuffer(media, 'audio/mpeg')

        const apiUrl = `https://api.stellarwa.xyz/tools/vocalremover?url=${encodeURIComponent(link)}&key=${stellarKey}`
        const res = await axios.get(apiUrl)
        
        if (!res.data.status) throw new Error('Error en la API')

        let { vocal, instrumental } = res.data.result
        await conn.sendMessage(m.chat, { audio: { url: vocal }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
        await conn.sendMessage(m.chat, { audio: { url: instrumental }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
        await m.react('✅')
    } catch (e) {
        m.reply('⚠️ *Error:* No se pudo procesar. Revisa el log.')
    }
}
handler.command = ['vocalremover', 'separar']
export default handler
