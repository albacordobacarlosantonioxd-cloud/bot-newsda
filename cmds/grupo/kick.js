var handler = async (m, { conn, isAdmins, isOwner }) => {
    if (!(isOwner || isAdmins)) return m.reply('✨ *Solo administradores.*')
    let user = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    if (!user) return m.reply('✨ Etiqueta o responde a alguien.')
    
    try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
        m.reply('👋 Usuario eliminado.')
    } catch (e) {
        m.reply('❌ No se pudo eliminar al usuario. ¿Soy administrador?')
    }
}
handler.help = ['kick']
handler.tags = ['admin']
handler.command = ['kick', 'sacar', 'eliminar']
handler.group = true
handler.botAdmin = true

export default handler
