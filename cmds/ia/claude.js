import { apiSucceeded, evoGet } from '../../core/evogb.js'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Escribe tu consulta*\n\n> *Ejemplo:* ${usedPrefix + command} ¿Cómo hacer un bot de WhatsApp?`)

    try {
        const data = await evoGet('/ai/claude', { text: query })

        if (!apiSucceeded(data)) return m.reply('*Sin respuesta del servidor.*')

        let response = `┏━━━━━━━━━━━━━━━━┓\n`
        response += `┃    *CLAUDE AI*  ┃\n`
        response += `┗━━━━━━━━━━━━━━━━┛\n\n`
        response += `*Respuesta:*\n${data.result}\n\n`
        response += `━━━━━━━━━━━━━━━━━━━━\n`
        response += `Charly Developer`

        // Usamos m.reply que ya está vinculado a m.chat y al quoted
        await m.reply(response)
    } catch (e) {
        console.error(e)
        m.reply('*Error de conexión con Evo.*')
    }
}

handler.help = ['claude', 'clau']
handler.tags = ['ai']
handler.command = ['claude', 'clau']

export default handler
