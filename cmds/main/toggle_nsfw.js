var handler = async (m, { text, chat, isAdmins, isOwner }) => {
    // 1. Verificación de permisos
    if (!isAdmins && !isOwner) return m.reply('❌ Solo los admins pueden usar esto.')
    
    // 2. Lógica según lo que escribas después de .nsfw
    if (!text) return m.reply('¿Qué quieres hacer?\nUsa: *.nsfw on* para activar\nUsa: *.nsfw off* para desactivar')

    if (text === 'on' || text === 'enable') {
        chat.nsfw = true
        m.reply('🔞 *Modo NSFW ACTIVADO en este grupo.*')
    } else if (text === 'off' || text === 'disable') {
        chat.nsfw = false
        m.reply('🛡️ *Modo NSFW DESACTIVADO en este grupo.*')
    } else {
        m.reply('❌ Opción no válida. Usa: *.nsfw on* u *.nsfw off*')
    }
}

// Aquí cambiamos el comando principal a 'nsfw'
handler.command = ['nsfw'] 
export default handler
