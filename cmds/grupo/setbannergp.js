var handler = async (m, { conn, isAdmins, isOwner }) => {
    // 1. Verificación de permisos
    if (!(isOwner || isAdmins)) return m.reply('✨ *Solo administradores.*')
    
    // 2. Identificar si hay una imagen (citada o en el mensaje)
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!/image/.test(mime)) return m.reply('✨ Responde a una imagen o envía una con el comando para cambiar la foto del grupo.')

    try {
        // 3. Descargar la imagen y actualizar
        let img = await q.download()
        await conn.updateProfilePicture(m.chat, img)
        
        m.reply('📸 Foto del grupo actualizada correctamente.')
        
    } catch (e) {
        console.error(e)
        m.reply('❌ No se pudo actualizar la foto. Asegúrate de que soy administrador.')
    }
}

handler.help = ['setppgp']
handler.tags = ['admin']
handler.command = ['setbannergp', 'setppgp', 'fotogp']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
