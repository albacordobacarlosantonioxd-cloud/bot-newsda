var handler = async (m, { conn, usedPrefix }) => {
    let imageMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png' 
    
    let menu = `┏━━━━━━━━━━━━━━━━━━━━┓
┃  🏮 *CHARLY-BOT MAESTRO V2* 🏮
┗━━━━━━━━━━━━━━━━━━━━┛

👤 *Hᴏʟᴀ:* @${m.sender.split('@')[0]}
⚡ *Dᴇᴠ:* Charly Developer
📡 *Sᴛᴀᴛᴜs:* Online 🟢
📅 *Fᴇᴄʜᴀ:* ${new Date().toLocaleDateString()}

━━━━━━━┫ *I.A. COMMANDS* ┣━━━━━━━
🤖 *${usedPrefix}ia*
└─ _Consulta a Gemini AI_
🧠 *${usedPrefix}claude*
└─ _Consulta a Claude AI_
💬 *${usedPrefix}gpt*
└─ _Consulta a ChatGPT_
🎨 *${usedPrefix}nb*
└─ _Generar imágenes artísticas_
📸 *${usedPrefix}brat*
└─ _Sticker con texto estilo Brat_

━━━━━━━┫ *DOWNLOADERS* ┣━━━━━━━
🎵 *${usedPrefix}audio*
└─ _Descargar música de YouTube_
🎥 *${usedPrefix}video*
└─ _Descargar video de YouTube_
📸 *${usedPrefix}ig*
└─ _Contenido de Instagram_
👥 *${usedPrefix}fb*
└─ _Videos de Facebook_
🎵 *${usedPrefix}tk*
└─ _Videos de TikTok sin marca_
📦 *${usedPrefix}mf*
└─ _Archivos de MediaFire_

━━━━━━━┫ *TOOLS & ADMIN* ┣━━━━━━━
✨ *${usedPrefix}hd*
└─ _Mejorar calidad de imagen_
🌎 *${usedPrefix}tr*
└─ _Traductor de idiomas_
🔍 *${usedPrefix}yts*
└─ _Buscador de YouTube_
🐙 *${usedPrefix}ghstalk*
└─ _Información de GitHub_
📣 *${usedPrefix}tagall*
└─ _Mencionar a todos_
🔓 *${usedPrefix}open*
└─ _Abrir el grupo_
🔒 *${usedPrefix}close*
└─ _Cerrar el grupo_
🗑️ *${usedPrefix}del*
└─ _Eliminar mensajes_
🚪 *${usedPrefix}kick*
└─ _Expulsar usuario_
👑 *${usedPrefix}promote*
└─ _Dar administrador_
👤 *${usedPrefix}demote*
└─ _Quitar administrador_
🔗 *${usedPrefix}link*
└─ _Enlace del grupo_
🔄 *${usedPrefix}revoke*
└─ _Renovar enlace_

`

    await conn.sendMessage(m.chat, { 
        image: { url: imageMenu }, 
        caption: menu,
        mentions: [m.sender]
    }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'comandos', 'h']

export default handler
