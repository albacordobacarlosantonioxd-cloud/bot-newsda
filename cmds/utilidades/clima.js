import { evoGet } from '../../core/evogb.js'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    // --- LÓGICA PARA EL CLIMA ---
    if (/clima|weather/i.test(command)) {
        if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿De qué ciudad deseas saber el clima?*\n*Ejemplo:* ${usedPrefix + command} Mexico`)
        
        await m.react('🌤️')
        try {
            // Usamos la versión 'full' como en tu captura
            const data = await evoGet('/tools/clima', { city: text, version: 'full' }, { includeApiKey: false })
            if (!data.status) return m.reply('❌ No se pudo obtener el clima para esa ubicación.')

            const res = data.result
            let weatherInfo = `┏━━━━━━━━━━━━━━━━┓\n`
            weatherInfo += `┃   🌤️ *ESTADO DEL CLIMA* ┃\n`
            weatherInfo += `┗━━━━━━━━━━━━━━━━┛\n\n`
            weatherInfo += `📍 *Lᴜɢᴀʀ:* ${res.location}\n`
            weatherInfo += `🌡️ *Tᴇᴍᴘᴇʀᴀᴛᴜʀᴀ:* ${res.temperature}\n`
            weatherInfo += `☁️ *Cᴏɴᴅɪᴄɪóɴ:* ${res.condition}\n`
            weatherInfo += `💧 *Hᴜᴍᴇᴅᴀᴅ:* ${res.humidity}\n`
            weatherInfo += `💨 *Vɪᴇɴᴛᴏ:* ${res.wind}\n\n`
            weatherInfo += `━━━━━━━━━━━━━━━━━━━━\n`
            weatherInfo += `⚡ *𝘽𝙮 Charly Developer*`

            await m.reply(weatherInfo)
            await m.react('✅')
        } catch (e) {
            await m.react('❌')
            m.reply('⚠️ Error al consultar el clima.')
        }
    }

    // --- LÓGICA PARA EL ACORTADOR ---
    if (/short|acortar|tiny/i.test(command)) {
        let [url, alias] = text.split(' ')
        if (!url) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingresa el link.*\n*Ejemplo:* ${usedPrefix + command} https://google.com mi-link`)

        await m.react('🔗')
        try {
            const data = await evoGet('/tools/shortlink', { url, alias }, { includeApiKey: false })
            if (!data.status) return m.reply('⚠️ Error: Alias en uso o link inválido.')

            let txt = `┏━━━━━━━━━━━━━━━━┓\n`
            txt += `┃   🔗 *LINK SHORTENER* ┃\n`
            txt += `┗━━━━━━━━━━━━━━━━┛\n\n`
            txt += `🚀 *Aᴄᴏʀᴛᴀᴅᴏ:* ${data.result.url}\n\n`
            txt += `⚡ *𝘽𝙮 Charly Developer*`

            await m.reply(txt)
            await m.react('✅')
        } catch (e) {
            await m.react('❌')
            m.reply('⚠️ Error al acortar el enlace.')
        }
    }
}

handler.help = ['clima', 'short']
handler.tags = ['tools']
handler.command = ['clima', 'weather', 'short', 'acortar', 'tiny']

export default handler
