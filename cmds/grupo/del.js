var handler = async (m, { conn, isBotAdmin }) => {
    // 1. Verificación robusta del mensaje citado
    const quoted = m.quoted ? m.quoted : null
    if (!quoted) return m.reply('✨ Responde al mensaje que deseas eliminar.')

    // 2. Permisos: Si no es del bot, el bot debe ser admin
    if (!quoted.fromMe && !isBotAdmin) return m.reply('⚠️ Necesito ser *Administrador* para borrar mensajes de otros.')

    try {
        // 3. Borrado usando la llave (key) directamente del objeto citado
        await conn.sendMessage(m.chat, { 
            delete: {
                remoteJid: m.chat,
                fromMe: quoted.fromMe,
                id: quoted.id,
                participant: quoted.sender
            }
        })

    } catch (e) {
        console.error("Error al borrar:", e)
        m.reply('⚠️ No pude borrar el mensaje. Intenta de nuevo.')
    }
}

handler.help = ['del']
handler.tags = ['group']
handler.command = ['del', 'delete', 'borrar']
handler.group = true
handler.admin = true 
handler.botAdmin = true

export default handler
