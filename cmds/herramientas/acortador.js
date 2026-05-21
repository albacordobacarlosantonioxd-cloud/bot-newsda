import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    // Dividimos el texto para ver si el usuario puso un alias (ej: .tiny https://google.com mi-link)
    let [url, alias] = text.split(' ')
    
    if (!url) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingresa el link que deseas acortar.*\n*Ejemplo:* ${usedPrefix + command} https://github.com/Charly-Bot mi-repo`)

    await m.react('🔗')

    try {
        const key = "sasuke"
        // Construimos la URL con el alias si es que el usuario lo puso
        let apiUrl = `https://api.evogb.org/tools/shortlink?url=${encodeURIComponent(url)}&key=${key}`
        if (alias) apiUrl += `&alias=${encodeURIComponent(alias)}`

        const { data } = await axios.get(apiUrl)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('⚠️ *Error:* No se pudo acortar el enlace. Puede que el alias ya esté en uso.')
        }

        let res = data.result
        let txt = `┏━━━━━━━━━━━━━━━━┓\n`
        txt += `┃   🔗 *LINK SHORTENER* ┃\n`
        txt += `┗━━━━━━━━━━━━━━━━┛\n\n`
        txt += `📌 *Oʀɪɢɪɴᴀʟ:* ${url.length > 30 ? url.substring(0, 30) + '...' : url}\n`
        txt += `🚀 *Aᴄᴏʀᴛᴀᴅᴏ:* ${res.url}\n\n`
        txt += `━━━━━━━━━━━━━━━━━━━━\n`
        txt += `⚡ *𝘽𝙮 Charly Developer*`

        await m.reply(txt)
        await m.react('✅')

    } catch (e) {
        console.error("Error en Shortlink:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* El servidor de enlaces no respondió.')
    }
}

handler.help = ['acortar', 'shortlink', 'tiny']
handler.tags = ['tools']
handler.command = ['acortar', 'short', 'shortlink', 'tiny']

export default handler
