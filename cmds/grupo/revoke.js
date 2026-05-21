var handler = async (m, { conn, isAdmins, isOwner }) => {
    // 1. Verificación de permisos
    if (!(isOwner || isAdmins)) return m.reply('✨ *Solo administradores.*')

    try {
        // 2. Revocar el enlace actual y generar uno nuevo
        await conn.groupRevokeInvite(m.chat)
        m.reply('✅ Enlace de invitación revocado. El anterior ya no funciona y se ha generado uno nuevo.')
    } catch (e) {
        console.error(e)
        m.reply('❌ No se pudo restablecer el enlace. ¿Soy administrador?')
    }
}

handler.help = ['revoke']
handler.tags = ['admin']
handler.command = ['revoke', 'renovar', 'restablecer']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
