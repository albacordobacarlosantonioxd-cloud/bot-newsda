var handler = async (m, { conn, usedPrefix, command }) => {
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    if (!who) return m.reply(`✨ Etiqueta o responde a alguien para quitarle el admin.`)

    try {
        await conn.groupParticipantsUpdate(m.chat, [who], 'demote')
        m.reply('✅ Usuario degradado a miembro.')
    } catch (e) {
        m.reply('❌ No se pudo quitar el rango. ¿Soy administrador?')
    }
}
handler.help = ['demote']
handler.tags = ['admin']
handler.command = ['demote', 'quitaradmin']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
