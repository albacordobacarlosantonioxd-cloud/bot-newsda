import fetch from "node-fetch"

var handler = async (m, { text, usedPrefix, command }) => {
    // Usamos el m.reply de tu smsg
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingrese su consulta para la IA.*\n*Ejemplo:* ${usedPrefix + command} ¿Cómo optimizar código Node.js?`)

    await m.react('💬')

    try {
        const res = await fetch(`https://api.delirius.store/ia/chatgpt?q=${encodeURIComponent(text)}`)
        const json = await res.json()

        if (!json.status || !json.data) {
            await m.react('❌')
            return m.reply('⚠️ *Error en el servidor de la IA.*')
        }

        // Formateamos la respuesta con tu marca
        let response = `┏━━━━━━━━━━━━━━━━┓\n`
        response += `┃    🤖 *CHATGPT AI* ┃\n`
        response += `┗━━━━━━━━━━━━━━━━┛\n\n`
        response += `${json.data}\n\n`
        response += `━━━━━━━━━━━━━━━━━━━━\n`
        response += `⚡ *𝘽𝙮 Charly Developer*\n`
        response += `📡 *Charly Developers*`

        await m.reply(response)
        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('🛑 *Error en la Matrix:* No se pudo obtener respuesta.')
    }
}

handler.help = ['chatgpt', 'ia']
handler.tags = ['ia']
// Array de comandos para que tu core/loader.js lo reconozca de una
handler.command = ['chatgpt', 'ia', 'gpt']

export default handler
