import { evoGet } from '../../core/evogb.js'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingresa el correo para leer los mensajes.*\n*Ejemplo:* ${usedPrefix + command} correo@ejemplo.com`)

    await m.react('📥')

    try {
        const data = await evoGet('/tools/tempmail-read', { email: text })

        if (!data.status || !data.result || data.result.length === 0) {
            await m.react('📭')
            return m.reply('📪 *Bandeja vacía:* Aún no han llegado mensajes a este correo.')
        }

        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📥 *MENSAJES RECIBIDOS* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`

        // Listamos los últimos mensajes encontrados
        data.result.forEach((msg, i) => {
            info += `*${i + 1}. De:* ${msg.from}\n`
            info += `📌 *Asunto:* ${msg.subject}\n`
            info += `💬 *Contenido:* ${msg.text || 'Mensaje vacío'}\n`
            info += `━━━━━━━━━━━━━━━━━━━━\n`
        })

        info += `⚡ *𝘽𝙮 Charly Developer*`

        await m.reply(info)
        await m.react('✅')

    } catch (e) {
        console.error("Error en ReadMail:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* No se pudo acceder a la bandeja de entrada.')
    }
}

handler.help = ['readmail']
handler.tags = ['tools']
handler.command = ['readmail', 'leermail', 'checkmail']

export default handler
