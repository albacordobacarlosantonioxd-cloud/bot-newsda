import { default as makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
import pino from 'pino'

if (!global.conns) global.conns = new Map()
if (!global.jndidb_code) global.jndidb_code = new Set()

var handler = async (m, { conn }) => {
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let idUsuario = who.split('@')[0]
    let rutaSesion = path.join(`./CharlySesiones/clon_${idUsuario}`)

    if (global.conns.has(idUsuario)) {
        return m.reply(`🤖 *Ya tienes un clon activo en este momento.*`)
    }

    if (global.jndidb_code.has(idUsuario)) {
        return m.reply(`⏳ *Ya se está generando un código para ti. Espera...*`)
    }

    global.jndidb_code.add(idUsuario)
    await m.react('🔥')
    m.reply(`⏳ *Abriendo canal seguro... Te llegará el código al privado en unos 8 segundos.*`)

    try {
        if (!fs.existsSync(rutaSesion)) {
            fs.mkdirSync(rutaSesion, { recursive: true })
        }

        const { state, saveCreds } = await useMultiFileAuthState(rutaSesion)

        // Forzamos configuraciones de aislamiento para que no choque con tu Main Bot
        let sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['Ubuntu', 'Chrome', `20.0.${idUsuario}`], // Agente único por usuario
            syncFullHistory: false, // No descargar chats viejos (ahorra RAM y evita cierres)
            markOnlineOnConnect: true
        })

        if (!sock.authState.creds.registered) {
            // Le damos 8 segundos exactos para que el WebSocket se asiente bien en los servidores de WA
            await new Promise(resolve => setTimeout(resolve, 8000))
            
            try {
                let codigo = await sock.requestPairingCode(idUsuario)
                
                let infoCode = `┏━━━━━━━━━━━━━━━━┓\n`
                infoCode += `┃    🤖 *CÓDIGO DE BOT* ┃\n`
                infoCode += `┗━━━━━━━━━━━━━━━━┛\n\n`
                infoCode += `🔑 *Tu código de vinculación:* \`\`\`${codigo}\`\`\`\n\n`
                infoCode += `📌 *Instrucciones:*\n1. Entra a Dispositivos vinculados.\n2. Selecciona "Vincular con número de teléfono".\n3. Pega este código.`
                
                await conn.sendMessage(who, { text: infoCode }, { quoted: m })
            } catch (errCode) {
                console.error(`[Error Code User ${idUsuario}]:`, errCode.message)
                global.jndidb_code.delete(idUsuario)
                // Si falla, borramos sesión corrupta para que no intente reciclarla
                fs.rmSync(rutaSesion, { recursive: true, force: true })
                return m.reply(`❌ *WhatsApp rechazó el intento por saturación de red. Reintenta el comando .code ahora mismo.*`)
            }
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection === 'open') {
                global.conns.set(idUsuario, sock)
                global.jndidb_code.delete(idUsuario)
                await conn.sendMessage(m.chat, { text: `✅ *¡Bot Clon activado!* @${idUsuario} ya está corriendo.`, mentions: [who] })
            }
            if (connection === 'close') {
                let razon = lastDisconnect?.error?.output?.statusCode
                global.jndidb_code.delete(idUsuario)
                
                if (razon === DisconnectReason.loggedOut || razon === 401 || razon === 405) {
                    fs.rmSync(rutaSesion, { recursive: true, force: true })
                    global.conns.delete(idUsuario)
                    if (razon === 405) handler(m, { conn }) // Si pide restart, lo relanza limpio automáticamente
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
        global.jndidb_code.delete(idUsuario)
        m.reply(`⚠️ *Error al levantar el proceso.*`)
    }
}

handler.help = ['code']
handler.tags = ['tools']
handler.command = ['code']

export default handler
