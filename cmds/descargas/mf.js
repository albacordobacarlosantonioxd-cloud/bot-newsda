import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Ingresa un enlace de MediaFire*\n\n> *Ejemplo:* ${usedPrefix + command} https://www.mediafire.com/file/...`)

    try {
        const data = await evoGet('/dl/mediafire', { url: query }, { includeApiKey: false })

        if (!apiSucceeded(data)) {
            return m.reply('⚠️ *No se pudo obtener el archivo.*')
        }

        const file = extractMediaItem(data)
        const downloadUrl = extractMediaUrl(data)
        if (!downloadUrl) return m.reply('⚠️ *No se encontró el enlace de descarga.*')
        const name = file.name || file.fileName || file.filename || 'Archivo MediaFire'
        const type = file.type || file.mimetype || file.mimeType || 'application/octet-stream'

        let ui = `┏━━━━━━━━━━━━━━━━┓\n`
        ui += `┃   📦 *MEDIAFIRE DL* ┃\n`
        ui += `┗━━━━━━━━━━━━━━━━┛\n\n`
        ui += `📄 *NOMBRE:* ${name}\n`
        ui += `⚖️ *PESO:* ${file.size || file.fileSize || 'Desconocido'}\n`
        ui += `📁 *TIPO:* ${type}\n\n`
        ui += `━━━━━━━━━━━━━━━━━━━━\n`
        ui += `⚡ *𝘽𝙮 Charly Developer*\n`
        ui += `📡 *Charly Developers*`

        // Enviamos como documento para que no pierda formato ni peso
        await conn.sendMessage(m.chat, { 
            document: { url: downloadUrl },
            fileName: name,
            mimetype: /apk/i.test(type) ? 'application/vnd.android.package-archive' : type,
            caption: ui
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        return m.reply('⚠️ *Error al conectar con MediaFire.*')
    }
}

handler.help = ['mediafire', 'mf']
handler.tags = ['downloader']
// Configurado para tu loader recursivo en core/loader.js
handler.command = ['mediafire', 'mf']

export default handler
