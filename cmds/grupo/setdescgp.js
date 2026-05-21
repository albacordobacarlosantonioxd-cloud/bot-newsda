var handler = async (m, { conn, isAdmins, isOwner, text }) => {
    // 1. Verificación de permisos
    if (!(isOwner || isAdmins)) return m.reply('✨ *Solo administradores.*')
    
    // 2. Verificar que el usuario escribió el nuevo texto
    if (!text) return m.reply('✨ Escribe la nueva descripción que deseas poner en el grupo.')

    try {
        // 3. Actualizar la descripción del grupo
        await conn.groupUpdateDescription(m.chat, text)
        m.reply('📝 Descripción del grupo actualizada correctamente.')

    } catch (e) {
        console.error(e)
        m.reply('❌ No se pudo actualizar la descripción. Asegúrate de que soy administrador.')
    }
}

handler.help = ['setdescgp <texto>']
handler.tags = ['admin']
handler.command = ['setdescgp', 'setgpdesc', 'setdesc']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
