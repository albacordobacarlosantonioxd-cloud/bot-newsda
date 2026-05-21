import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *¿Qué imágenes de TikTok buscas?*\n\n> *Ejemplo:* ${usedPrefix + command} motos mt09`)

    await m.react('📸')

    try {
        const { data } = await axios.get(`https://api.delirius.store/search/tiktoksearchimages?query=${encodeURIComponent(query)}`)

        if (!data.status || !data.data.length) {
            await m.react('❌')
            return m.reply('⚠️ No encontré resultados para esa búsqueda.')
        }

        const res = data.data[0]
        const fotos = res.download 

        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📸 *TIKTOK IMAGES* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📝 *𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝙲𝙸𝙾𝙽:* ${res.title || 'Sin descripción'}\n`
        info += `👤 *𝚄𝚂𝚄𝙰𝚁𝙸𝙾:* ${res.author}\n`
        info += `❤️ *𝙻𝙸𝙺𝙴𝚂:* ${res.likes.toLocaleString()}\n`
        info += `📸 *𝙵𝙾𝚃𝙾𝚂:* ${fotos.length}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*\n`
        info += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            image: { url: fotos[0] }, 
            caption: info 
        }, { quoted: m })

        if (fotos.length > 1) {
            for (let i = 1; i < fotos.length; i++) {
                if (i >= 6) break 
                await new Promise(resolve => setTimeout(resolve, 1000)) 
                await conn.sendMessage(m.chat, { image: { url: fotos[i] } }, { quoted: m })
            }
        }

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ Error al procesar la búsqueda en TikTok.')
    }
}

handler.help = ['tiktokimg', 'ttimg']
handler.tags = ['search']
handler.command = ['tiktokimg', 'ttimg', 'ttsearch']

export default handler
