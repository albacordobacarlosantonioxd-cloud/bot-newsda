import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Escribe tu consulta*\n\n> *Ejemplo:* ${usedPrefix + command} ¿Cómo hacer un bot de WhatsApp?`)

    await m.react('🧠')

    try {
        const key = "sasuke" 

        const { data } = await axios.get(`https://api.evogb.org/ai/claude?text=${encodeURIComponent(query)}&key=${key}`)

        if (!data.status) {
            await m.react('❌')
            return m.reply('⚠️ *Sin respuesta del servidor.*')
        }

        let response = `┏━━━━━━━━━━━━━━━━┓\n`
        response += `┃    🤖 *CLAUDE AI* ┃\n`
        response += `┗━━━━━━━━━━━━━━━━┛\n\n`
        response += `💡 *RESPUESTA:*\n${data.result}\n\n`
        response += `━━━━━━━━━━━━━━━━━━━━\n`
        response += `⚡ *𝘽𝙮 Charly Developer*\n`
        response += `📡 *Charly Developers*`

        // Usamos m.reply que ya está vinculado a m.chat y al quoted
        await m.reply(response)
        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Error de conexión con la Matrix.*')
    }
}

handler.help = ['claude', 'clau']
handler.tags = ['ai']
handler.command = ['claude', 'clau']

export default handler
