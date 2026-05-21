var handler = async (m, { conn, isAdmins, isOwner }) => {
    // 1. Verificación de permisos del que usa el comando
    if (!(isOwner || isAdmins)) return m.reply('✨ *Solo administradores.*')

    // 2. Identificar al objetivo
    let user = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    
    if (!user) return m.reply('✨ Etiqueta o responde al mensaje de alguien para darle admin.')

    try {
        // 3. Ejecutar el ascenso
        await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
        m.reply('👑 ¡Felicidades! Ahora eres Admin.')
        
    } catch (e) {
        console.error(e)
        m.reply('❌ No se pudo dar el rango. Asegúrate de que soy administrador.')
    }
}

handler.help = ['promote']
handler.tags = ['admin']
handler.command = ['promote', 'daradmin']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
