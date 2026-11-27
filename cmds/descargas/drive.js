import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*Ingresa el enlace de Google Drive.*\n*Ejemplo:* ${usedPrefix + command} https://drive.google.com/file/d/...`)

    try {
        const data = await evoGet('/dl/google-drive', { url: text })

        if (!apiSucceeded(data)) {
            return m.reply('⚠️ *Error:* No se pudo obtener el archivo. Asegúrate de que el enlace sea público.')
        }

        const res = extractMediaItem(data)
        const downloadUrl = extractMediaUrl(data)
        if (!downloadUrl) return m.reply('⚠️ *Error:* La API no devolvió un enlace de descarga.')
        const fileName = res.fileName || res.filename || 'Archivo GDrive'
        const mimetype = res.mimetype || res.mimeType || 'application/octet-stream'
        
        // Estructura visual del mensaje
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📁 *G-DRIVE DL* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📄 *Nᴏᴍʙʀᴇ:* ${fileName}\n`
        info += `📦 *Tᴀᴍᴀñᴏ:* ${res.fileSize || 'Desconocido'}\n`
        info += `📎 *Tɪᴘᴏ:* ${mimetype}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // Enviamos el documento
        // Si es carpeta, la API suele devolver un .zip, el bot lo maneja automáticamente.
        await conn.sendMessage(m.chat, { 
            document: { url: downloadUrl },
            fileName,
            mimetype,
            caption: info
        }, { quoted: m })

    } catch (e) {
        console.error("Error en GDrive:", e.message)
        return m.reply('⚠️ *Error de conexión:* El servidor de GDrive no respondió o el enlace es inválido.')
    }
}

handler.help = ['gdrive', 'drive']
handler.tags = ['descargas']
handler.command = ['gdrive', 'drive', 'googledrive']

export default handler
