import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingresa el enlace de Google Drive.*\n*Ejemplo:* ${usedPrefix + command} https://drive.google.com/file/d/...`)

    await m.react('⏳')

    try {
        const key = "sasuke"
        const { data } = await axios.get(`https://api.evogb.org/dl/google-drive?url=${encodeURIComponent(text)}&key=${key}`)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('⚠️ *Error:* No se pudo obtener el archivo. Asegúrate de que el enlace sea público.')
        }

        const res = data.result
        
        // Estructura visual del mensaje
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📁 *G-DRIVE DL* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📄 *Nᴏᴍʙʀᴇ:* ${res.fileName || 'Archivo GDrive'}\n`
        info += `📦 *Tᴀᴍᴀñᴏ:* ${res.fileSize || 'Desconocido'}\n`
        info += `📎 *Tɪᴘᴏ:* ${res.mimetype || 'application/octet-stream'}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // Enviamos el documento
        // Si es carpeta, la API suele devolver un .zip, el bot lo maneja automáticamente.
        await conn.sendMessage(m.chat, { 
            document: { url: res.downloadUrl }, 
            fileName: res.fileName, 
            mimetype: res.mimetype,
            caption: info
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error en GDrive:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Error de conexión:* El servidor de GDrive no respondió o el enlace es inválido.')
    }
}

handler.help = ['gdrive', 'drive']
handler.tags = ['descargas']
handler.command = ['gdrive', 'drive', 'googledrive']

export default handler
