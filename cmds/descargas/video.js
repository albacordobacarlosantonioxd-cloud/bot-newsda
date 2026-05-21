import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *¿Qué video deseas descargar?*\n\n> *Ejemplo:* ${usedPrefix + command} https://youtu... o ${usedPrefix + command} Calle 24`)

    await m.react('⏳')

    try {
        let url = query
        
        // Si no es un link, buscamos el video primero
        if (!query.includes('youtu')) {
            const search = await axios.get(`https://api.evogb.org/search/yt?query=${encodeURIComponent(query)}&key=sasuke`)
            if (!search.data.status || !search.data.result.length) {
                await m.react('❌')
                return m.reply('⚠️ No se encontraron resultados para tu búsqueda.')
            }
            url = search.data.result[0].url // Tomamos el primer link encontrado
        }

        // Procedemos a la descarga con la API de Delirius
        const { data } = await axios.get(`https://api.delirius.store/download/ytmp4?url=${url}`)

        if (!data.status) {
            await m.react('❌')
            return m.reply('⚠️ No se pudo procesar la descarga del video.')
        }

        const vid = data.data
        
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃    🎥 *YOUTUBE MP4* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📌 *TÍᴛᴜʟᴏ:* ${vid.title}\n`
        info += `👤 *Cᴀɴᴀʟ:* ${vid.author}\n`
        info += `⚙️ *Cᴀʟɪᴅᴀᴅ:* ${vid.quality || vid.format}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*\n`
        info += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            video: { url: vid.download }, 
            caption: info,
            mimetype: 'video/mp4',
            fileName: `${vid.title}.mp4`
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ Ocurrió un error al procesar la solicitud.')
    }
}

handler.help = ['video <búsqueda/link>']
handler.tags = ['downloader']
handler.command = ['video', 'ytvideo', 'mp4', 'ytmp4']

export default handler
