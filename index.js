import "./settings.js";
import main from './main.js';
import events from './cmds/events.js';
import { Browsers, makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason } from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import chalk from "chalk";
import fs from "fs";
import readlineSync from "readline-sync";
import { smsg } from "./core/message.js";
import { createQr } from './core/qr.js';

// --- IMPORTACIÓN DE LA BASE DE DATOS ---
import { initDB, loadDatabase } from './core/system/initdb.js';

// Captura de errores globales
process.on('unhandledRejection', (reason) => {
    console.log(chalk.red.bold('[!] RECHAZO NO MANEJADO:'), reason);
});
process.on('uncaughtException', (err) => {
    console.log(chalk.red.bold('[!] EXCEPCIÓN NO CAPTURADA:'), err);
});

if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });

console.clear();
cfonts.say('Charly-Bot', { align: 'center', gradient: ['#00ff00', '#4facfe'] });

// Inicializamos la base de datos antes de arrancar el bot
initDB();

let opcion = process.argv.includes("--qr") ? "1" : process.argv.includes("--code") ? "2" : "";
const qrImagePath = './qr.png';
let reconnectTimer = null;
let reconnectDelay = 3000;
let isStarting = false;

function scheduleReconnect() {
    if (reconnectTimer) return;

    const delay = reconnectDelay;
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    console.log(chalk.yellow(`[!] Reintentando conexión en ${Math.ceil(delay / 1000)} segundos.`));
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void startBot();
    }, delay);
}

async function startBot() {
    if (isStarting) return;
    isStarting = true;

    try {
        const { state, saveCreds } = await useMultiFileAuthState(global.sessionName || './Sessions/Owner');
        let version;
        try {
            ({ version } = await fetchLatestBaileysVersion());
        } catch (error) {
            console.log(chalk.yellow(`[!] No se pudo consultar la versión de WhatsApp: ${error.message}`));
        }
        const logger = pino({ level: "silent" });

        const sock = makeWASocket({
            ...(version ? { version } : {}),
            logger,
            printQRInTerminal: false,
            browser: Browsers.macOS('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            markOnlineOnConnect: false,
            syncFullHistory: false
        });

        global.client = sock;
        sock.ev.on("creds.update", saveCreds);

        if (!state.creds.registered && opcion === "2") {
            let num = readlineSync.question(chalk.bgMagenta.white(" Ingresa tu número (+521...): "));
            num = num.replace(/\D/g, "");
            if (!num) throw new Error('El número de teléfono no es válido.');
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(num);
                    console.log(chalk.black.bgCyan(` TU CÓDIGO: `), chalk.bold.white(code?.match(/.{1,4}/g)?.join("-") || code));
                } catch (error) {
                    console.error(chalk.red('[!] No se pudo generar el código de vinculación:'), error.message);
                }
            }, 3000);
        }

        sock.ev.on("connection.update", async (update) => {
            const { qr, connection, lastDisconnect } = update;
            if (qr && (opcion === "1" || !opcion)) {
                try {
                    const terminalQr = await createQr(qr, qrImagePath);
                    console.log(chalk.yellow("[!] Escanea el QR desde la terminal o abre qr.png:"));
                    console.log(terminalQr);
                } catch (error) {
                    console.error(chalk.red('[!] No se pudo generar el QR:'), error.message);
                }
            }
            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(chalk.red(`[ERROR] Conexión perdida.`));
                    scheduleReconnect();
                } else {
                    console.log(chalk.red('[!] La sesión se cerró. Vuelve a vincular el dispositivo.'));
                }
            }
            if (connection === "open") {
                reconnectDelay = 3000;
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
                console.log(chalk.green(`[✓] Bot Online: ${sock.user.name || 'Charly-Bot'}`));
                if (fs.existsSync(qrImagePath)) fs.unlinkSync(qrImagePath);
                try { await events(sock); } catch (e) { console.log(chalk.red("[!] Error en eventos")); }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            for (const rawMsg of chatUpdate.messages || []) {
                try {
                    if (!rawMsg?.message || rawMsg.key?.remoteJid === 'status@broadcast') continue;

                    const type = Object.keys(rawMsg.message)[0];
                    if (['protocolMessage', 'reactionMessage', 'pollUpdateMessage'].includes(type)) continue;
                    if (chatUpdate.type !== 'notify') continue;

                    const m = await smsg(sock, rawMsg);
                    loadDatabase(m);

                    const prefixes = global.prefixes || ['.', '/', ',', '#'];
                    const hasPrefix = prefixes.some(prefix => m.text?.startsWith(prefix));
                    const isAudioMessage = m.type === 'audioMessage' || /^(audio\/|application\/ogg)/i.test(m.msg?.mimetype || '');
                    if ((!m.text || !hasPrefix) && !isAudioMessage) continue;

                    await main(sock, m, chatUpdate);
                } catch (err) {
                    if (!String(err?.message || err).includes('split')) {
                        console.error(chalk.red.bold("[!] ERROR:"), err?.message || err);
                    }
                }
            }
        });
    } catch (error) {
        console.error(chalk.red('[!] No se pudo iniciar la conexión de WhatsApp:'), error.message);
        scheduleReconnect();
    } finally {
        isStarting = false;
    }
}

void startBot();
