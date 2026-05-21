import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Ingresa lo que deseas buscar*\n\n> *Ejemplo:* ${usedPrefix + command} Lupita`)

    await m.react('🔍')

    try {
        const key = "sasuke" 
        
        const { data } = await axios.get(`https://api.evogb.org/search/yt?query=${encodeURIComponent(query)}&key=${key}`)
        
        if (!data.status || !data.result.length) {
            await m.react('❌')
            return m.reply('⚠️ *No se encontraron resultados.*')
        }

        let ui = `┏━━━━━━━━━━━━━━━━┓\n`
        ui += `┃    🎥 *YOUTUBE SEARCH* ┃\n`
        ui += `┗━━━━━━━━━━━━━━━━┛\n\n`

        data.result.slice(0, 6).forEach((vid, i) => {
            ui += `*${i + 1}.* ${vid.title}\n`
            ui += `👤 *Autor:* ${vid.author || vid.autor}\n`
            ui += `⏱️ *Duración:* ${vid.duration}\n`
            ui += `👁️ *Vistas:* ${vid.views}\n`
            ui += `🔗 *Link:* ${vid.url}\n\n`
        })

        ui += `━━━━━━━━━━━━━━━━━━━━\n`
        ui += `⚡ *𝘽𝙮 Charly Developer*\n`
        ui += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            image: { url: data.result[0].banner || data.result[0].image }, 
            caption: ui 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Error al conectar con la API de YouTube.*')
    }
}

handler.help = ['ytsearch', 'yt']
handler.tags = ['search']
// Configurado como array para tu core/loader.js
handler.command = ['ytsearch', 'yts', 'youtube', 'yt']

export default handler
