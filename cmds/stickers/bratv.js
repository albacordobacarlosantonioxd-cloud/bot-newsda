import { apiSucceeded, evoGet, extractMediaUrl } from '../../core/evogb.js'
import { sticker as createSticker } from '../../core/stickers.js'

const MAX_MEDIA_SIZE = 15 * 1024 * 1024

async function downloadGeneratedMedia(url) {
    const mediaUrl = new URL(url)
    if (mediaUrl.protocol !== 'https:') throw new Error('El enlace generado no es seguro.')

    const response = await fetch(mediaUrl, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`El archivo generado respondió con HTTP ${response.status}.`)

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > MAX_MEDIA_SIZE) throw new Error('El archivo generado supera el tamaño permitido.')

    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length || buffer.length > MAX_MEDIA_SIZE) throw new Error('El archivo generado está vacío o supera el tamaño permitido.')
    return buffer
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const prompt = String(text || '').trim()
    if (!prompt) return m.reply(`Escribe el texto para crear el sticker animado.\nEjemplo: ${usedPrefix + command} Charly`)

    try {
        const data = await evoGet('/tools/brat', { text: prompt, animated: 'true' }, { includeApiKey: false })
        if (!apiSucceeded(data)) return m.reply('Evo no pudo generar el sticker Brat animado.')

        const mediaUrl = extractMediaUrl(data)
        if (!mediaUrl) return m.reply('La respuesta de Evo no incluyó el archivo generado.')

        const media = await downloadGeneratedMedia(mediaUrl)
        const stickerBuffer = await createSticker(media)
        await conn.sendMessage(m.chat, { sticker: stickerBuffer, isAnimated: true }, { quoted: m })
    } catch (error) {
        console.error('[BRATV]', error)
        return m.reply('No se pudo crear el sticker Brat animado.')
    }
}

handler.help = ['bratv <texto>']
handler.tags = ['stickers']
handler.command = ['bratv']

export default handler