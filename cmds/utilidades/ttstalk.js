import axios from "axios"

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`*🔍 INGRESA UN USUARIO*\nEjemplo: ${usedPrefix}${command} alexcaraudio0`)

    const username = query.replace('@', '')
    await m.react('👤')

    try {
        // La URL exacta de tu captura
        const { data } = await axios.get(`https://api.evogb.org/stalking/tiktok?username=${username}&key=sasuke`)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('❌ No se encontró información para este usuario.')
        }

        const res = data.result
        
        // Ajustamos las variables según la estructura del JSON de tu imagen
        let profile = `┏━━━━━━━━━━━━━━━━┓\n`
        profile += `┃   👤 *TIKTOK STALK* ┃\n`
        profile += `┗━━━━━━━━━━━━━━━━┛\n\n`
        profile += `*╭─── [ PERFIL ] ───*\n`
        profile += `│ 🏷️ *Nᴏᴍʙʀᴇ:* ${res.nickname || 'Sin nombre'}\n`
        profile += `│ 👤 *Usᴜᴀʀɪᴏ:* @${res.username}\n`
        profile += `│ 🛡️ *Vᴇʀɪғɪᴄᴀᴅᴏ:* ${res.verified ? '✅' : '❌'}\n`
        profile += `│ 🔒 *Pʀɪᴠᴀᴅᴏ:* ${res.private_account ? 'Si' : 'No'}\n`
        profile += `│ 📄 *Bɪᴏ:* ${res.signature || 'Sin descripción'}\n`
        profile += `*╰───────────────*\n\n`
        profile += `*╭── [ ESTADÍSTICAS ] ──*\n`
        profile += `│ 👥 *Sᴇɢᴜɪᴅᴏʀᴇs:* ${res.stats.followers.toLocaleString()}\n`
        profile += `│ 👣 *Sɪɢᴜɪᴇɴᴅᴏ:* ${res.stats.following.toLocaleString()}\n`
        profile += `│ 💖 *Mᴇ ɢᴜsᴛᴀ:* ${res.stats.likes.toLocaleString()}\n`
        profile += `│ 🎥 *Vɪᴅᴇᴏs:* ${res.stats.videos.toLocaleString()}\n`
        profile += `*╰───────────────*\n\n`
        profile += `━━━━━━━━━━━━━━━━━━━━\n`
        profile += `⚡ *𝘽𝙮 Charly Developer*`

        await conn.sendMessage(m.chat, { 
            image: { url: res.avatar }, // Usamos 'avatar' directo como sale en tu imagen
            caption: profile 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Error de conexión:* La API no respondió correctamente.')
    }
}

handler.help = ['tiktokstalk']
handler.tags = ['tools']
handler.command = ['tiktokstalk', 'ttstalk']

export default handler
