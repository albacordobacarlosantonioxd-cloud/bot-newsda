import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    const key = "sasuke"

    // --- LÓGICA PARA EL CLIMA ---
    if (/clima|weather/i.test(command)) {
        if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿De qué ciudad deseas saber el clima?*\n*Ejemplo:* ${usedPrefix + command} Mexico`)
        
        await m.react('🌤️')
        try {
            // Usamos la versión 'full' como en tu captura
            const { data } = await axios.get(`https://api.evogb.org/tools/clima?city=${encodeURIComponent(text)}&version=full&key=${key}`)
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
            let apiUrl = `https://api.evogb.org/tools/shortlink?url=${encodeURIComponent(url)}&key=${key}`
            if (alias) apiUrl += `&alias=${encodeURIComponent(alias)}`

            const { data } = await axios.get(apiUrl)
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
