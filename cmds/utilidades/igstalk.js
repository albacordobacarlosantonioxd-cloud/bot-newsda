import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿A qué perfil de Instagram deseas stalkear?*\n*Ejemplo:* ${usedPrefix + command} yamaha_mt09_oficial`)

    const username = query.replace('@', '')
    await m.react('📸')

    try {
        // Usamos el endpoint de instagram de EvoGB que pasaste
        const { data } = await axios.get(`https://api.evogb.org/stalking/instagram?username=${username}&key=sasuke`)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('❌ No se encontró información para este perfil de Instagram.')
        }

        const res = data.result
        
        let profile = `┏━━━━━━━━━━━━━━━━┓\n`
        profile += `┃   📸 *INSTAGRAM STALK* ┃\n`
        profile += `┗━━━━━━━━━━━━━━━━┛\n\n`
        profile += `*╭─── [ PERFIL ] ───*\n`
        profile += `│ 🏷️ *Nᴏᴍʙʀᴇ:* ${res.full_name || 'Sin nombre'}\n`
        profile += `│ 👤 *Usᴜᴀʀɪᴏ:* @${res.username}\n`
        profile += `│ 🛡️ *Vᴇʀɪғɪᴄᴀᴅᴏ:* ${res.is_verified ? '✅ Oficial' : '❌ No'}\n`
        profile += `│ 🔒 *Pʀɪᴠᴀᴅᴏ:* ${res.is_private ? 'Si' : 'No'}\n`
        profile += `│ 📄 *Bɪᴏ:* ${res.biography || 'Sin descripción'}\n`
        profile += `*╰───────────────*\n\n`
        profile += `*╭── [ ESTADÍSTICAS ] ──*\n`
        profile += `│ 👥 *Sᴇɢᴜɪᴅᴏʀᴇs:* ${res.stats.followers.toLocaleString()}\n`
        profile += `│ 👣 *Sɪɢᴜɪᴇɴᴅᴏ:* ${res.stats.following.toLocaleString()}\n`
        profile += `│ 🎥 *Pᴏsᴛs:* ${res.stats.posts.toLocaleString()}\n`
        profile += `*╰───────────────*\n\n`
        profile += `━━━━━━━━━━━━━━━━━━━━\n`
        profile += `⚡ *𝘽𝙮 Charly Developer*\n`
        profile += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            image: { url: res.profile_pic }, 
            caption: profile 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error en IG Stalk:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error:* El servidor de Instagram no respondió. Intenta más tarde.')
    }
}

handler.help = ['instagramstalk', 'igstalk']
handler.tags = ['tools']
handler.command = ['instagramstalk', 'igstalk', 'iguser']

export default handler
