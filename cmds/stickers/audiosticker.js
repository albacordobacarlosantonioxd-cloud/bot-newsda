import { downloadMediaMessage, prepareWAMessageMedia, proto } from '@whiskeysockets/baileys'
import { randomBytes } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const MAX_DURATION = 25
const SESSION_SECONDS = 60
const MAX_STICKER_SIZE = 900 * 1024
const sessions = globalThis.__charlyAudioStickerSessions ??= new Map()
const silentLogger = { info: () => {}, error: () => {}, warn: () => {} }

function patchAudioStickerProto() {
    const Message = proto?.Message
    const StickerMessage = Message?.StickerMessage
    if (!Message || !StickerMessage || Message.__charlyAudioStickerPatched) return

    const originalStickerEncode = StickerMessage.encode
    StickerMessage.encode = function (message, writer) {
        const audioMessage = message?.audioMessage
        if (!audioMessage) return originalStickerEncode.call(this, message, writer)

        const hadAudioMessage = Object.prototype.hasOwnProperty.call(message, 'audioMessage')
        if (hadAudioMessage) delete message.audioMessage
        let encoded
        try {
            encoded = originalStickerEncode.call(this, message, writer)
        } finally {
            if (hadAudioMessage) message.audioMessage = audioMessage
        }
        if (!Message.AudioMessage?.encode) throw new Error('Baileys no soporta el formato de audio requerido.')
        Message.AudioMessage.encode(audioMessage, encoded.uint32(210).fork()).ldelim()
        return encoded
    }

    if (typeof StickerMessage.fromObject === 'function') {
        const originalStickerFromObject = StickerMessage.fromObject
        StickerMessage.fromObject = function (object) {
            const message = originalStickerFromObject.call(this, object)
            if (object?.audioMessage) {
                message.audioMessage = Message.AudioMessage?.fromObject
                    ? Message.AudioMessage.fromObject(object.audioMessage)
                    : object.audioMessage
            }
            return message
        }
    }

    const originalMessageEncode = Message.encode
    Message.encode = function (message, writer) {
        const audioStickerMessage = message?.audioStickerMessage
        if (audioStickerMessage && !Message.FutureProofMessage?.encode) {
            throw new Error('Esta versión de Baileys no soporta audio stickers.')
        }
        if (audioStickerMessage) {
            if (Object.prototype.hasOwnProperty.call(message, 'stickerMessage')) delete message.stickerMessage
            if (Object.prototype.hasOwnProperty.call(message, 'audioStickerMessage')) delete message.audioStickerMessage
        }

        const encoded = originalMessageEncode.call(this, message, writer)
        if (audioStickerMessage && Message.FutureProofMessage) {
            message.audioStickerMessage = audioStickerMessage
            Message.FutureProofMessage.encode(audioStickerMessage, encoded.uint32(1074).fork()).ldelim()
        }
        return encoded
    }

    if (typeof Message.fromObject === 'function') {
        const originalMessageFromObject = Message.fromObject
        Message.fromObject = function (object) {
            const message = originalMessageFromObject.call(this, object)
            if (object?.audioStickerMessage) {
                const inner = object.audioStickerMessage.message || object.audioStickerMessage
                if (inner?.stickerMessage && object.audioStickerMessage.message?.stickerMessage?.audioMessage) {
                    inner.stickerMessage.audioMessage = object.audioStickerMessage.message.stickerMessage.audioMessage
                }
                message.audioStickerMessage = { message: inner }
                delete message.stickerMessage
                if (inner) Object.setPrototypeOf(message, inner)
            }
            return message
        }
    }

    Message.__charlyAudioStickerPatched = true
}

function unwrapMessage(message) {
    let content = message || {}
    for (let i = 0; i < 6; i++) {
        const wrapped = content.ephemeralMessage?.message
            || content.viewOnceMessageV2?.message
            || content.viewOnceMessageV2Extension?.message
            || content.viewOnceMessage?.message
            || content.documentWithCaptionMessage?.message
        if (!wrapped) break
        content = wrapped
    }
    return content
}

function getMediaInfo(node) {
    if (!node) return { kind: null, mime: '', seconds: 0 }
    const content = unwrapMessage(node.message || {})
    const type = node.type || Object.keys(content).find(key => /imageMessage|videoMessage|stickerMessage|audioMessage|documentMessage/i.test(key)) || ''
    const media = node.msg || content[type] || {}
    const mime = String(node.mimetype || media.mimetype || '').toLowerCase()
    const seconds = Number(media.seconds || node.seconds || 0)

    if (/videoMessage/i.test(type) || mime.startsWith('video/')) return { kind: 'video', mime: mime || 'video/mp4', seconds }
    if (/stickerMessage/i.test(type) || /image\/webp/i.test(mime)) return { kind: 'sticker', mime: 'image/webp', seconds }
    if (/imageMessage/i.test(type) || mime.startsWith('image/')) return { kind: 'image', mime: mime || 'image/jpeg', seconds: 0 }
    if (/audioMessage/i.test(type) || /audio|ogg|opus|mpeg|mp3|wav|m4a|aac/i.test(mime)) return { kind: 'audio', mime: mime || 'audio/mpeg', seconds }
    return { kind: null, mime, seconds }
}

async function downloadBuffer(node, conn) {
    if (typeof node?.download === 'function') {
        const buffer = await node.download()
        return buffer ? Buffer.from(buffer) : null
    }

    if (!node?.message || !node?.key) return null
    return downloadMediaMessage(node, 'buffer', {}, {
        logger: silentLogger,
        reuploadRequest: conn.updateMediaMessage?.bind(conn)
    })
}

function inputExtension(mime) {
    if (/ogg|opus/i.test(mime)) return 'ogg'
    if (/mp4|m4a|aac/i.test(mime)) return 'm4a'
    if (/wav/i.test(mime)) return 'wav'
    if (/webm/i.test(mime)) return 'webm'
    return 'mp3'
}

async function convertBuffer(buffer, extension, outputExtension, args) {
    const id = randomBytes(8).toString('hex')
    const inputPath = path.join(os.tmpdir(), `charly_audio_${id}.${extension}`)
    const outputPath = path.join(os.tmpdir(), `charly_audio_${id}.${outputExtension}`)
    try {
        await fs.writeFile(inputPath, buffer)
        await execFileAsync(ffmpegPath || 'ffmpeg', [
            '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
            ...args, outputPath
        ], { timeout: 120000, windowsHide: true })
        return await fs.readFile(outputPath)
    } finally {
        await fs.unlink(inputPath).catch(() => {})
        await fs.unlink(outputPath).catch(() => {})
    }
}

async function createSticker(buffer, kind) {
    if (kind === 'sticker') return buffer

    const scale = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1'
    const profiles = kind === 'video' ? [[10, 50], [8, 40], [6, 30], [5, 20]] : [[1, 80]]

    for (const [fps, quality] of profiles) {
        const filter = kind === 'video' ? `fps=${fps},${scale}` : scale
        const args = [
            '-t', String(MAX_DURATION), '-vf', filter,
            '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(quality),
            '-loop', '0', '-preset', 'picture', '-an', '-vsync', '0', '-f', 'webp'
        ]
        if (kind === 'image') args.unshift('-frames:v', '1')

        const sticker = await convertBuffer(buffer, kind === 'video' ? 'mp4' : 'jpg', 'webp', args)
        if (kind !== 'video' || sticker.length <= MAX_STICKER_SIZE) return sticker
    }

    throw new Error('El sticker animado supera el tamaño permitido. Prueba con un video más corto.')
}

async function createAudioMessage(conn, buffer, info, extension) {
    const ogg = await convertBuffer(buffer, extension, 'ogg', [
        '-vn', '-map', '0:a:0', '-t', String(MAX_DURATION),
        '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '48k',
        '-vbr', 'on', '-application', 'audio', '-f', 'ogg'
    ])
    if (!ogg.length) throw new Error('No se encontró audio válido en el archivo.')

    const prepared = await prepareWAMessageMedia(
        { audio: ogg, mimetype: 'audio/ogg; codecs=opus', ptt: true },
        { upload: conn.waUploadToServer }
    )
    if (!prepared?.audioMessage) throw new Error('Baileys no pudo preparar el audio.')

    prepared.audioMessage.seconds = Math.max(1, Math.min(MAX_DURATION, Math.round(info.seconds || 1)))
    prepared.audioMessage.ptt = true
    prepared.audioMessage.mimetype = 'audio/ogg; codecs=opus'
    return prepared.audioMessage
}

async function sendAudioSticker(conn, chat, stickerBuffer, isAnimated, audioMessage) {
    patchAudioStickerProto()
    const prepared = await prepareWAMessageMedia(
        { sticker: stickerBuffer, isAnimated },
        { upload: conn.waUploadToServer }
    )
    if (!prepared?.stickerMessage) throw new Error('Baileys no pudo preparar el sticker.')

    prepared.stickerMessage.isAnimated = Boolean(isAnimated)
    prepared.stickerMessage.audioMessage = audioMessage
    const payload = {
        __proto__: prepared,
        audioStickerMessage: { message: prepared },
        messageContextInfo: { messageSecret: randomBytes(32) }
    }
    await conn.relayMessage(chat, payload, {})
}

function sessionKey(m) {
    return `${m.chat}:${m.sender}`
}

function clearSession(key) {
    const session = sessions.get(key)
    if (session?.timer) clearTimeout(session.timer)
    sessions.delete(key)
}

async function startSession(m, conn, stickerBuffer, isAnimated) {
    const key = sessionKey(m)
    clearSession(key)
    const timer = setTimeout(() => {
        sessions.delete(key)
        conn.sendMessage(m.chat, {
            text: `⌛ La sesión de sticker con audio terminó. Vuelve a enviar la imagen para intentarlo otra vez.`
        }, { quoted: m }).catch(() => {})
    }, SESSION_SECONDS * 1000)
    timer.unref?.()

    sessions.set(key, {
        stickerBuffer,
        isAnimated,
        expiresAt: Date.now() + SESSION_SECONDS * 1000,
        processing: false,
        timer
    })
    return m.reply(`🖼️ Sticker preparado. Envíame un audio o nota de voz en este chat durante los próximos ${SESSION_SECONDS} segundos y lo combinaré. Duración máxima: ${MAX_DURATION} segundos.`)
}

function isVisual(kind) {
    return kind === 'image' || kind === 'video' || kind === 'sticker'
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const rawText = String(text || '').trim()
    const key = sessionKey(m)
    const activeSession = sessions.get(key)

    if (/^(batal|cancelar|cancel|stop)$/i.test(rawText)) {
        if (!activeSession) return m.reply('No tienes una sesión de sticker con audio activa.')
        clearSession(key)
        return m.reply('✅ Sesión cancelada.')
    }

    const ownInfo = getMediaInfo(m)
    const quotedInfo = getMediaInfo(m.quoted)
    const visualNode = isVisual(ownInfo.kind) ? m : isVisual(quotedInfo.kind) ? m.quoted : null
    const visualInfo = visualNode === m ? ownInfo : quotedInfo
    const audioNode = ownInfo.kind === 'audio' ? m : quotedInfo.kind === 'audio' ? m.quoted : null
    const audioInfo = audioNode === m ? ownInfo : quotedInfo

    if (!visualNode) {
        if (audioNode) return m.reply(`Primero selecciona una imagen, sticker o video con ${usedPrefix + command}; después podrás enviar el audio.`)
        return m.reply(`🎵 *Sticker con audio*\n\nResponde a una imagen, sticker o video con ${usedPrefix + command}. Después envía un audio o nota de voz en el mismo chat.\n\nLos videos con audio se combinan directamente. Duración máxima del audio/video: ${MAX_DURATION} segundos. Escribe \`${usedPrefix + command} cancelar\` para detener una sesión.`)
    }

    if (visualInfo.kind === 'video' && visualInfo.seconds > MAX_DURATION) {
        return m.reply(`El video debe durar como máximo ${MAX_DURATION} segundos.`)
    }
    if (audioInfo?.seconds > MAX_DURATION) {
        return m.reply(`El audio debe durar como máximo ${MAX_DURATION} segundos.`)
    }

    try {
        const visualBuffer = await downloadBuffer(visualNode, conn)
        if (!visualBuffer?.length) throw new Error('No pude descargar la imagen o el video.')
        const stickerBuffer = await createSticker(visualBuffer, visualInfo.kind)
        const isAnimated = visualInfo.kind === 'video' || (visualInfo.kind === 'sticker' && visualBuffer.includes(Buffer.from('ANIM')))

        if (audioNode) {
            const audioBuffer = await downloadBuffer(audioNode, conn)
            if (!audioBuffer?.length) throw new Error('No pude descargar el audio.')
            const extension = audioInfo.kind === 'video' ? 'mp4' : inputExtension(audioInfo.mime)
            const audioMessage = await createAudioMessage(conn, audioBuffer, audioInfo, extension)
            await sendAudioSticker(conn, m.chat, stickerBuffer, isAnimated, audioMessage)
            return
        }

        if (visualInfo.kind === 'video') {
            let audioMessage
            try {
                audioMessage = await createAudioMessage(conn, visualBuffer, visualInfo, 'mp4')
            } catch (error) {
                if (/matches no streams|no audio stream|does not contain any stream/i.test(error.message)) {
                    return startSession(m, conn, stickerBuffer, true)
                }
                throw error
            }
            await sendAudioSticker(conn, m.chat, stickerBuffer, true, audioMessage)
            return
        }

        return startSession(m, conn, stickerBuffer, isAnimated)
    } catch (error) {
        console.error('[AUDIO STICKER]', error)
        return m.reply(`❌ No se pudo crear el sticker con audio: ${error.message}`)
    }
}

handler.before = async (m, { conn }) => {
    if (!m || m.fromMe) return false
    const bodyText = String(m.text || '').trim()
    if (/^[./!#,]?(audiosticker|stikeraudio|stickeraudio|saudio)\b/i.test(bodyText)) return false

    const key = sessionKey(m)
    const session = sessions.get(key)
    if (!session || session.processing) return false
    if (Date.now() > session.expiresAt) {
        clearSession(key)
        return false
    }
    const info = getMediaInfo(m)
    if (info.kind !== 'audio') return false
    if (info.seconds > MAX_DURATION) {
        await m.reply(`El audio debe durar como máximo ${MAX_DURATION} segundos.`)
        return true
    }

    session.processing = true
    try {
        const audioBuffer = await downloadBuffer(m, conn)
        if (!audioBuffer?.length) throw new Error('No pude descargar el audio.')
        const audioMessage = await createAudioMessage(conn, audioBuffer, info, inputExtension(info.mime))
        await sendAudioSticker(conn, m.chat, session.stickerBuffer, session.isAnimated, audioMessage)
        clearSession(key)
    } catch (error) {
        session.processing = false
        console.error('[AUDIO STICKER SESSION]', error)
        await m.reply(`❌ No se pudo combinar el audio: ${error.message}`)
    }
    return true
}

handler.help = ['audiosticker']
handler.tags = ['stickers']
handler.command = ['audiosticker', 'stikeraudio', 'stickeraudio', 'saudio']

export default handler