var handler = async (m, { conn, text, participants }) => {
    // 1. Verificamos que escribiste algo
    if (!text) return m.reply('✨ Escribe el mensaje que quieres taguear.\n*Ejemplo:* .tag hola a todos')

    // 2. Extraemos los IDs de forma segura
    // Usamos el ID directamente del objeto participants
    let users = participants.map(u => u.id)

    try {
        // 3. Enviamos el mensaje con las menciones ocultas
        await conn.sendMessage(m.chat, { 
            text: text, 
            mentions: users 
        }, { quoted: m })

    } catch (e) {
        console.error("Error en hidetag:", e)
        m.reply('⚠️ No se pudo realizar el tagueo.')
    }
}

handler.help = ['tag <texto>']
handler.tags = ['group']
handler.command = ['tag', 'hidetag', 'h']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
