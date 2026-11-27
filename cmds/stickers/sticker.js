import { sticker as createSticker } from '../../core/stickers.js'

var handler = async (m, { conn, usedPrefix, command }) => {
    const quoted = m.quoted || m
    const mime = (quoted.msg || quoted).mimetype || ''
    const isVideoSticker = command === 'ss'
    const expectedMime = isVideoSticker ? /^video\//i : /^image\//i

    if (!mime) {
        const mediaType = isVideoSticker ? 'un video corto' : 'una imagen'
        return m.reply(`Responde a ${mediaType} con ${usedPrefix + command}.`)
    }
    if (!expectedMime.test(mime)) {
        const mediaType = isVideoSticker ? 'video' : 'imagen'
        return m.reply(`Este comando requiere ${mediaType}.`)
    }

    const duration = Number(quoted.seconds || quoted.msg?.seconds || 0)
    if (isVideoSticker && duration > 10) return m.reply('El video debe durar como máximo 10 segundos.')

    try {
        const media = await quoted.download()
        if (!media?.length) throw new Error('No se pudo descargar el archivo.')
        const stickerBuffer = await createSticker(media)
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer,
            isAnimated: isVideoSticker
        }, { quoted: m })
    } catch (error) {
        console.error('[STICKER]', error)
        return m.reply('No se pudo convertir el archivo en sticker.')
    }
}

handler.help = ['s (imagen)', 'ss (video corto)']
handler.tags = ['stickers']
handler.command = ['s', 'sticker', 'ss']

export default handler
