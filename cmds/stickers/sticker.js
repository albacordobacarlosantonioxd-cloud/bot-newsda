var handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (!mime) return m.reply(`✨ *Responde a una imagen o video corto con ${usedPrefix + command}*`)

    if (/image|video/.test(mime)) {
        try {
            // Descargamos el contenido directamente desde el mensaje
            let media = await q.download()
            
            // Enviamos como sticker usando el core de Baileys
            await conn.sendMessage(m.chat, { 
                sticker: media,
                mimetype: 'image/webp',
                contextInfo: {
                    externalAdReply: {
                        title: '🏮 CHARLY-BOT MAESTRO V2',
                        body: 'Charly Developer',
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png',
                        sourceUrl: 'https://github.com/Charly-Bot'
                    }
                }
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('⚠️ *Error:* para procesar videos.')
        }
    } else {
        m.reply(`✨ *Formato no compatible. Usa una imagen o video corto.*`)
    }
}

handler.help = ['s']
handler.tags = ['tools']
handler.command = ['s', 'sticker']

export default handler
