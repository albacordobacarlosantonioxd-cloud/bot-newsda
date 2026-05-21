import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingresa la URL del sitio web.*\n*Ejemplo:* ${usedPrefix + command} https://github.com/Charly-Bot`)

    // Validamos que sea un link
    if (!text.match(/https?:\/\//gi)) return m.reply('⚠️ *Error:* El enlace debe incluir http:// o https://')

    await m.react('📸')

    try {
        const key = "sasuke"
        const apiUrl = `https://api.evogb.org/tools/ssweb?url=${encodeURIComponent(text)}&device=desktop&key=${key}`

        const { data } = await axios.get(apiUrl)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('❌ *No se pudo tomar la captura.* Verifica que el sitio web sea accesible.')
        }

        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📸 *WEB SCREENSHOT* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `🌐 *Sɪᴛɪᴏ:* ${text}\n`
        info += `💻 *Dɪsᴘᴏsɪᴛɪᴠᴏ:* PC (Escritorio)\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // Enviamos la imagen resultante
        await conn.sendMessage(m.chat, { 
            image: { url: data.result.url }, 
            caption: info 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error en SSWeb:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* El servidor de capturas no respondió a tiempo.')
    }
}

handler.help = ['ssweb', 'ss']
handler.tags = ['tools']
handler.command = ['ssweb', 'ss', 'screenshot']

export default handler
