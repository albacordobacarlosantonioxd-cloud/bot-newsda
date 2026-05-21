import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿A qué usuario de GitHub deseas stalkear?*\n*Ejemplo:* ${usedPrefix + command} Charly-Bot`)

    const username = query.replace('@', '')
    await m.react('🐙')

    try {
        // Usamos el endpoint de github de EvoGB que pasaste
        const { data } = await axios.get(`https://api.evogb.org/stalking/github?username=${username}&key=sasuke`)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('❌ No se encontró información para este usuario de GitHub.')
        }

        const res = data.result
        
        let profile = `┏━━━━━━━━━━━━━━━━┓\n`
        profile += `┃   🐙 *GITHUB STALK* ┃\n`
        profile += `┗━━━━━━━━━━━━━━━━┛\n\n`
        profile += `*╭─── [ USUARIO ] ───*\n`
        profile += `│ 🏷️ *Nᴏᴍʙʀᴇ:* ${res.name || 'No disponible'}\n`
        profile += `│ 👤 *Usᴜᴀʀɪᴏ:* ${res.username}\n`
        profile += `│ 🏢 *Cᴏᴍᴘᴀñíᴀ:* ${res.company || 'Ninguna'}\n`
        profile += `│ 📍 *Uʙɪᴄᴀᴄɪóɴ:* ${res.location || 'No disponible'}\n`
        profile += `│ 📄 *Bɪᴏ:* ${res.bio || 'Sin descripción'}\n`
        profile += `*╰───────────────*\n\n`
        profile += `*╭── [ ESTADÍSTICAS ] ──*\n`
        profile += `│ 📦 *Rᴇᴘᴏs:* ${res.public_repos}\n`
        profile += `│ 👥 *Sᴇɢᴜɪᴅᴏʀᴇs:* ${res.followers.toLocaleString()}\n`
        profile += `│ 👣 *Sɪɢᴜɪᴇɴᴅᴏ:* ${res.following.toLocaleString()}\n`
        profile += `│ 📅 *Cʀᴇᴀᴅᴏ:* ${new Date(res.created_at).toLocaleDateString()}\n`
        profile += `*╰───────────────*\n\n`
        profile += `🔗 *URL:* ${res.url}\n\n`
        profile += `━━━━━━━━━━━━━━━━━━━━\n`
        profile += `⚡ *𝘽𝙮 Charly Developer*\n`
        profile += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            image: { url: res.avatar }, 
            caption: profile 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error en GH Stalk:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* El servidor de GitHub no respondió o el usuario es inválido.')
    }
}

handler.help = ['githubstalk', 'ghstalk']
handler.tags = ['tools']
handler.command = ['githubstalk', 'ghstalk', 'github']

export default handler
