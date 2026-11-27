import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'

const endpoints = {
    ig: '/dl/instagram',
    instagram: '/dl/instagram',
    fb: '/dl/facebookv2',
    facebook: '/dl/facebookv2',
    facebookv1: '/dl/facebook',
    fbv1: '/dl/facebook',
    twitter: '/dl/twitter',
    x: '/dl/twitter',
    threads: '/dl/threads',
    dropbox: '/dl/dropbox',
    soundcloud: '/dl/soundcloud',
    sc: '/dl/soundcloud',
    terabox: '/dl/terabox',
    deezer: '/dl/deezer'
}

const audioEndpoints = new Set(['/dl/soundcloud', '/dl/deezer'])
const documentEndpoints = new Set(['/dl/dropbox', '/dl/terabox'])

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Ingresa el enlace para descargar*\n\n> *Ejemplo:* ${usedPrefix + command} https://...`)

    const endpoint = endpoints[command]
    if (!endpoint) return m.reply('⚠️ Este comando de descarga no está configurado.')

    try {
        const data = await evoGet(endpoint, { url: query }, { includeApiKey: endpoint !== '/dl/deezer' })
        if (!apiSucceeded(data)) return m.reply('⚠️ *La API no devolvió un resultado válido.*')

        const media = extractMediaItem(data)
        const downloadUrl = extractMediaUrl(data)
        if (!downloadUrl) return m.reply('⚠️ *No se encontró el enlace de descarga.*')

        const title = media.title || media.name || media.fileName || command
        const mediaType = `${media.type || media.mimetype || media.mimeType || ''}`.toLowerCase()
        const caption = `📥 *${title}*\n\n⚡ *Charly Developer*`
        let message

        if (audioEndpoints.has(endpoint) || /audio/i.test(mediaType)) {
            message = { audio: { url: downloadUrl }, mimetype: media.mimetype || 'audio/mpeg', fileName: `${title}.mp3` }
        } else if (/image/i.test(mediaType) || /\.(jpe?g|png|webp)(\?|$)/i.test(downloadUrl)) {
            message = { image: { url: downloadUrl }, caption }
        } else if (documentEndpoints.has(endpoint)) {
            message = { document: { url: downloadUrl }, fileName: media.fileName || media.filename || `${title}`, mimetype: media.mimetype || media.mimeType || 'application/octet-stream', caption }
        } else {
            message = { video: { url: downloadUrl }, caption, mimetype: media.mimetype || 'video/mp4' }
        }

        await conn.sendMessage(m.chat, message, { quoted: m })
    } catch (e) {
        console.error(e.message)
        return m.reply('⚠️ *Ocurrió un error al conectar con la API de Evo.*')
    }
}

handler.help = Object.keys(endpoints)
handler.tags = ['downloader']
handler.command = Object.keys(endpoints)

export default handler
