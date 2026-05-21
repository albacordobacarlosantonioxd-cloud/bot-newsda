import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Ingresa un enlace de MediaFire*\n\n> *Ejemplo:* ${usedPrefix + command} https://www.mediafire.com/file/...`)

    await m.react('📥')

    try {
        const key = "sasuke" 

        const { data } = await axios.get(`https://api.evogb.org/dl/mediafire?url=${encodeURIComponent(query)}&key=${key}`)

        if (!data.status) {
            await m.react('❌')
            return m.reply('⚠️ *No se pudo obtener el archivo.*')
        }

        let ui = `┏━━━━━━━━━━━━━━━━┓\n`
        ui += `┃   📦 *MEDIAFIRE DL* ┃\n`
        ui += `┗━━━━━━━━━━━━━━━━┛\n\n`
        ui += `📄 *NOMBRE:* ${data.data.name}\n`
        ui += `⚖️ *PESO:* ${data.data.size}\n`
        ui += `📁 *TIPO:* ${data.data.type}\n\n`
        ui += `━━━━━━━━━━━━━━━━━━━━\n`
        ui += `⚡ *𝘽𝙮 Charly Developer*\n`
        ui += `📡 *Charly Developers*`

        // Enviamos como documento para que no pierda formato ni peso
        await conn.sendMessage(m.chat, { 
            document: { url: data.data.dl }, 
            fileName: data.data.name, 
            mimetype: data.data.type.includes('APK') ? 'application/vnd.android.package-archive' : 'application/octet-stream',
            caption: ui
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Error al conectar con MediaFire.*')
    }
}

handler.help = ['mediafire', 'mf']
handler.tags = ['downloader']
// Configurado para tu loader recursivo en core/loader.js
handler.command = ['mediafire', 'mf']

export default handler
