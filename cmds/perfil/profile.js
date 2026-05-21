var handler = async (m, { conn, user, db }) => {
    const userId = m.sender
    const name = user.name || m.pushName || 'Usuario'
    
    // Imagen de perfil
    const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')
    
    // Ranking
    const users = Object.entries(db.users).map(([key, value]) => ({ ...value, jid: key }))
    const sortedLevel = users.sort((a, b) => (b.level || 0) - (a.level || 0))
    const rank = sortedLevel.findIndex((u) => u.jid === userId) + 1

    let profileText = `「✿」 *PERFIL DE USUARIO* ◢\n\n`
    profileText += `♛ *Nombre:* ${name}\n`
    profileText += `♛ *Cumpleaños:* ${user.birth || 'No definido'}\n`
    profileText += `⸙ *Pasatiempo:* ${user.pasatiempo || 'No definido'}\n`
    profileText += `⚥ *Género:* ${user.genero || 'No definido'}\n`
    profileText += `♡ *Pareja:* ${user.marry ? '@' + user.marry.split('@')[0] : 'Soltero(a)'}\n\n`
    profileText += `✿ *Nivel:* ${user.level || 0}\n`
    profileText += `❀ *Ranking:* #${rank}\n\n`
    profileText += `⚡ *By Charly Developer*`

    await conn.sendMessage(m.chat, { 
        image: { url: pp }, 
        caption: profileText,
        mentions: [userId, user.marry].filter(v => v)
    }, { quoted: m })
}
handler.help = ['perfil']
handler.tags = ['user']
handler.command = ['perfil', 'profile']
export default handler
