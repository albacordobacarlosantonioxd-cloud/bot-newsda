import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *¿Qué canción deseas descargar en FLAC?*\n\n> *Ejemplo:* ${usedPrefix + command} Ivan Cornejo Me Prometi o ${usedPrefix + command} Que Loke`)

    await m.react('⏳')

    try {
        // 🚀 Petición directa a tu API en Vercel pasando la búsqueda completa
        console.log(`[Bot] Solicitando FLAC a tu API en Vercel para: ${query}`)
        const { data } = await axios.get(`https://api-charly.vercel.app/api/download/flac?q=${encodeURIComponent(query)}`)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('⚠️ No se pudo procesar la descarga de audio en FLAC, pa.')
        }

        const audio = data.result

        // 📝 Diseño estético al estilo Charly Developer
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃       *FLAC* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📌 *TÍᴛᴜʟᴏ:* ${audio.title}\n`
        info += `⚙️ *Cᴀʟɪᴅᴀᴅ:* ${audio.quality}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*\n`
        info += `📡 *Charly Developers*`

        // 📦 Se envía como documento de audio para conservar la fidelidad exacta (FLAC)
        await conn.sendMessage(m.chat, { 
            document: { url: audio.download_url }, 
            caption: info,
            mimetype: 'audio/flac', 
            fileName: `${audio.title}.flac`
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ Ocurrió un error al procesar tu audio FLAC.')
    }
}

handler.help = ['flac <búsqueda>']
handler.tags = ['downloader']
handler.command = ['flac', 'ytflac', 'audioflac']

export default handler
