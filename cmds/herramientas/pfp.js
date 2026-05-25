// Función externa para limpiar el JID y sacar solo el número de teléfono sin el @g.us o @s.whatsapp.net
function getNumber(jid = '') {
    return String(jid || '').split(':')[0].split('@')[0]
}

var handler = async (m, { conn }) => {
    // 1. Rastrear a quién le vamos a sacar la foto:
    // Al usuario taggeado (@mention), al que citaste (quoted), o si no, a ti mismo (sender)
    const target = m.mentions?.[0] || m.quoted?.sender || m.sender

    try {
        // 2. Intentar descargar la URL de la foto de perfil desde el cliente de WhatsApp (conn)
        const pp = await conn.profilePictureUrl(target, 'image')

        // 3. Diseñar el diseño de texto limpio al estilo Charly Developer
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃  🖼️ *FOTO DE PERFIL* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `👤 *Usuario:* @${getNumber(target)}\n`
        info += `🔓 *Estado:* Enlace obtenido con éxito\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // 4. Enviar la imagen de vuelta al chat con sus menciones activas
        await conn.sendMessage(m.chat, {
            image: { url: pp },
            caption: info,
            mentions: [target]
        }, { quoted: m })

    } catch (e) {
        // Si el usuario no tiene foto, la tiene oculta o hubo un error, cae aquí
        console.error("Error al obtener foto de perfil:", e.message)
        
        // Avisar en el chat que no se pudo (usando mención)
        await conn.sendMessage(m.chat, {
            text: `❌ *No se pudo obtener la foto de perfil de @${getNumber(target)}.*\n\n📌 _Posibles causas: La tiene oculta para no contactos, no tiene foto o el bot fue bloqueado._`,
            mentions: [target]
        }, { quoted: m })
    }
}

// Configuración de los disparadores idéntica a tus otros archivos
handler.help = ['pfp @user', 'profilepic', 'pp']
handler.tags = ['tools']
handler.command = ['pfp', 'profilepic', 'pp', 'perfil']

export default handler
