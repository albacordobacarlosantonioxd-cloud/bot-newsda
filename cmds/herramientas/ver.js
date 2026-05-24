import { downloadMediaMessage } from '@whiskeysockets/baileys'

var handler = async (m, { conn }) => {
    // 1. Rastrear el mensaje citado en todas las capas posibles
    let q = m.quoted ? m.quoted : null
    
    if (!q && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        q = {
            message: m.message.extendedTextMessage.contextInfo.quotedMessage,
            mediaKey: m.message.extendedTextMessage.contextInfo.mediaKey || null,
            id: m.message.extendedTextMessage.contextInfo.stanzaId
        }
    }

    if (!q) return m.reply('✨ *Responde a un mensaje de "ver una sola vez" (view once) para revelarlo.*')

    await m.react('🔥')

    try {
        // 2. Intentar descargar con el método inyectado del core 'q.download'
        let mediaBuffer = null
        if (typeof q.download === 'function') {
            mediaBuffer = await q.download().catch(() => null)
        }
        
        // 3. SI EL CORE FALLA, USAMOS LA FUNCIÓN IMPORTADA DIRECTA DE BAILEYS
        if (!mediaBuffer) {
            // Reconstruimos el objeto con la estructura exacta que Baileys exige
            const msgToDownload = {
                key: m.key,
                message: q.message?.viewOnceMessage?.message || q.message?.viewOnceMessageV2?.message || q.message
            }
            
            mediaBuffer = await downloadMediaMessage(
                msgToDownload,
                'buffer',
                {},
                { 
                    logger: console,
                    reconnectMode: 'on-error'
                }
            ).catch((err) => {
                console.error("Error directo de Baileys:", err.message)
                return null
            })
        }

        if (!mediaBuffer) {
            await m.react('❌')
            return m.reply('❌ *No se pudo procesar el archivo. Es posible que ya haya expirado o fue abierto.*')
        }

        // 4. Detectar si es imagen o video para el envío de vuelta
        let targetMsg = q.message?.viewOnceMessage?.message || q.message?.viewOnceMessageV2?.message || q.message || {}
        let isVideo = !!targetMsg.videoMessage || /video/.test(q.mimetype || (q.msg || q).mimetype || '')
        let mimeType = isVideo ? 'video' : 'image'

        // 5. Estructura visual de Charly Developer
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃  👁️‍🗨️ *REVELADOR VV* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `✅ *Contenido desbloqueado*\n`
        info += `📂 *Tipo:* ${isVideo ? 'Video MP4 🎥' : 'Imagen JPG 🖼️'}\n`
        info += `🔒 *Estado:* Protección removida\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // 6. Enviar el archivo liberado al chat
        await conn.sendMessage(m.chat, { 
            [mimeType]: mediaBuffer, 
            caption: info 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error crítico dentro del Handler:", e)
        await m.react('❌')
        m.reply('⚠️ *Error interno al procesar el descifrado.*')
    }
}

handler.help = ['ver', 'revelar', 'vv']
handler.tags = ['tools']
handler.command = ['ver', 'revelar', 'vv', 'viewonce']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
