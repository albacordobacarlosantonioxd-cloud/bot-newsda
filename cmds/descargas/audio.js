import axios from "axios"

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿Qué audio deseas descargar?*\n*Ejemplo:* ${usedPrefix + command} https://youtu... o ${usedPrefix + command} Calle 24`)

    await m.react('⏳')

    try {
        // CORRECCIÓN: Usamos 'let' en lugar de 'const' para permitir la reasignación
        let url = query
        
        if (!query.includes('youtu')) {
            const search = await axios.get(`https://api.evogb.org/search/yt?query=${encodeURIComponent(query)}&key=sasuke`)
            if (!search.data.status || !search.data.result.length) {
                await m.react('❌')
                return m.reply('⚠️ No se encontraron resultados para tu búsqueda.')
            }
            // Aquí es donde fallaba porque era una constante
            url = search.data.result[0].url 
        }

        const { data } = await axios.get(`https://api.delirius.store/download/ytmp3?url=${url}`)

        if (!data.status || !data.data) {
            await m.react('❌')
            return m.reply('⚠️ No se pudo procesar la descarga del audio.')
        }

        const aud = data.data
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃    🎵 *YOUTUBE MP3* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📌 *TÍᴛᴜʟᴏ:* ${aud.title}\n`
        info += `👤 *Cᴀɴᴀʟ:* ${aud.author}\n\n`
        info += `_Enviando audio, espera un momento..._\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*\n`
        info += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            image: { url: aud.image }, 
            caption: info 
        }, { quoted: m })

        await conn.sendMessage(m.chat, { 
            audio: { url: aud.download }, 
            mimetype: 'audio/mpeg', 
            fileName: `${aud.title}.mp3` 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ Error al obtener el audio en la Matrix.')
    }
}

handler.help = ['ytmp3', 'audio']
handler.tags = ['descargas']
handler.command = ['ytmp3', 'audio', 'mp3']

export default handler
