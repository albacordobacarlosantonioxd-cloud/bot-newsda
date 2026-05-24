import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import pino from 'pino'

if (!global.conns) global.conns = new Map()
if (!global.jndidb_qr) global.jndidb_qr = new Set()

var handler = async (m, { conn }) => {
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let idUsuario = who.split('@')[0]
    let rutaSesion = path.join(`./CharlySesiones/clon_${idUsuario}`)

    if (global.conns.has(idUsuario)) {
        return m.reply(`🤖 *Ya tienes un clon activo en este momento.*`)
    }

    if (global.jndidb_qr.has(idUsuario)) {
        return m.reply(`⏳ *Ya hay un proceso activo para ti. Espera...*`)
    }

    global.jndidb_qr.add(idUsuario)
    await m.react('🔥')
    m.reply(`⏳ *Generando código QR aislado... Espera un momento.*`)

    try {
        if (!fs.existsSync(rutaSesion)) {
            fs.mkdirSync(rutaSesion, { recursive: true })
        }

        const { state, saveCreds } = await useMultiFileAuthState(rutaSesion)

        let sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['ZorinOS', 'Chrome', `100.0.${idUsuario}`], // Navegador custom por clon
            syncFullHistory: false,
            markOnlineOnConnect: true
        })

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection, lastDisconnect } = update
            
            if (qr) {
                let rutaQR = path.join(rutaSesion, 'clon_qr.png')
                await QRCode.toFile(rutaQR, qr, { scale: 8 })

                let infoQR = `┏━━━━━━━━━━━━━━━━┓\n`
                infoQR += `┃    🖼️ *CÓDIGO QR* ┃\n`
                infoQR += `┗━━━━━━━━━━━━━━━━┛\n\n`
                infoQR += `📸 *Escanea este código para activar tu bot clonado.*\n\n`
                infoQR += `⏱️ *Expira en 45 segundos.*`

                await conn.sendMessage(m.chat, { 
                    image: fs.readFileSync(rutaQR), 
                    caption: infoQR 
                }, { quoted: m })

                if (fs.existsSync(rutaQR)) fs.unlinkSync(rutaQR)
            }

            if (connection === 'open') {
                global.conns.set(idUsuario, sock)
                global.jndidb_qr.delete(idUsuario)
                await conn.sendMessage(m.chat, { text: `✅ *¡Bot Clon activado!* @${idUsuario} ya está corriendo.`, mentions: [who] })
            }

            if (connection === 'close') {
                let razon = lastDisconnect?.error?.output?.statusCode
                
                if (razon === DisconnectReason.loggedOut || razon === 401 || razon === 405) {
                    fs.rmSync(rutaSesion, { recursive: true, force: true })
                    global.conns.delete(idUsuario)
                    global.jndidb_qr.delete(idUsuario)
                    
                    if (razon === 405) {
                        console.log(`[Clon ${idUsuario}] Forzando reinicio limpio por código 405.`)
                        handler(m, { conn }) // Auto-reparar la sesión muerta
                    } else {
                        await conn.sendMessage(m.chat, { text: `❌ *Sesión del clon cerrada por seguridad o expiración.*` })
                    }
                } else if (razon === 408 || razon === 503) {
                    global.jndidb_qr.delete(idUsuario)
                }
            }
        })

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                if (!chatUpdate.messages || chatUpdate.messages.length === 0) return
                const msgClon = chatUpdate.messages[0]
                if (!msgClon.message || msgClon.key.fromMe) return
                if (typeof global.charlyHandler === 'function') {
                    await global.charlyHandler(sock, msgClon, chatUpdate)
                }
            } catch (err) { console.error(err) }
        })

    } catch (error) {
        console.error(error)
        global.jndidb_qr.delete(idUsuario)
        m.reply(`⚠️ *Error al levantar el proceso.*`)
    }
}

handler.help = ['qr']
handler.tags = ['tools']
handler.command = ['qr']

export default handler
