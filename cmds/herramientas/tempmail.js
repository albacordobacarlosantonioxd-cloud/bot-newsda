import axios from 'axios'

var handler = async (m, { conn, usedPrefix, command }) => {
    await m.react('📧')

    try {
        const key = "sasuke"
        const { data } = await axios.get(`https://api.evogb.org/tools/tempmail?key=${key}`)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('⚠️ *Error 402:* Este endpoint es exclusivo para usuarios Premium o la API Key ha llegado a su límite.')
        }

        const res = data.result
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📧 *TEMP MAIL GENERADO* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `👤 *Cᴏʀʀᴇᴏ:* ${res.email}\n`
        info += `⏳ *Exᴘɪʀᴀ:* En 10-60 minutos\n\n`
        info += `*Nota:* Usa el comando ${usedPrefix}checkmail para ver la bandeja de entrada.\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        await m.reply(info)
        await m.react('✅')

    } catch (e) {
        console.error("Error en TempMail:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* No se pudo generar el correo temporal.')
    }
}

handler.help = ['tempmail']
handler.tags = ['tools']
handler.command = ['tempmail', 'mail', 'correo']

export default handler
