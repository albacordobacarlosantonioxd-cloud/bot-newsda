import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    // Dividimos el texto para obtener el idioma de destino y el contenido
    // Formato: .traducir en Hola mundo
    let [lang, ...content] = text.split(' ')
    let txt = content.join(' ')

    // Si el usuario no especifica idioma, por defecto usamos español (es)
    if (!lang || !txt) {
        // Si solo envía texto sin prefijo de idioma, asumimos que quiere traducir al español
        if (text) {
            lang = 'es'
            txt = text
        } else {
            return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Uso correcto:* ${usedPrefix + command} [idioma] [texto]\n*Ejemplo:* ${usedPrefix + command} en Hola cómo estás\n\n*Nota:* Si no pones idioma, se traducirá al español por defecto.`)
        }
    }

    await m.react('🌎')

    try {
        const key = "sasuke"
        const apiUrl = `https://api.evogb.org/tools/translate?text=${encodeURIComponent(txt)}&to=${lang}&key=${key}`

        const { data } = await axios.get(apiUrl)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('❌ *No se pudo realizar la traducción.* Verifica el código del idioma.')
        }

        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   🌎 *TRADUCCIÓN* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📝 *Oʀɪɢɪɴᴀʟ:* ${txt}\n`
        info += `✨ *Rᴇsᴜʟᴛᴀᴅᴏ:* ${data.result}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        await m.reply(info)
        await m.react('✅')

    } catch (e) {
        console.error("Error en Traductor:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* El servicio de traducción no está disponible.')
    }
}

handler.help = ['traducir']
handler.tags = ['tools']
handler.command = ['traducir', 'translate', 'tr']

export default handler
