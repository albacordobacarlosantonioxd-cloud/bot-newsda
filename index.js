import "./settings.js";
import main from './main.js';
import events from './cmds/events.js';
import { Browsers, makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason } from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import QRCode from "qrcode"; 
import chalk from "chalk";
import fs from "fs";
import readlineSync from "readline-sync";
import { smsg } from "./core/message.js";

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

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessionName || './Sessions/Owner');
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: "silent" });

    const sock = makeWASocket({
        version,
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
        setTimeout(async () => {
            let code = await sock.requestPairingCode(num);
            console.log(chalk.black.bgCyan(` TU CÓDIGO: `), chalk.bold.white(code?.match(/.{1,4}/g)?.join("-") || code));
        }, 3000);
    }

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;
        if (qr && (opcion === "1" || !opcion)) {
            console.log(chalk.yellow("[!] QR generado: Abre 'qr.png' para escanear."));
            await QRCode.toFile('./qr.png', qr);
        }
        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.red(`[ERROR] Conexión perdida. Reconectando...`));
                startBot();
            }
        }
        if (connection === "open") {
            console.log(chalk.green(`[✓] Bot Online: ${sock.user.name || 'Charly-Bot'}`));
            if (fs.existsSync('./qr.png')) fs.unlinkSync('./qr.png');
            try { await events(sock); } catch (e) { console.log(chalk.red("[!] Error en eventos")); }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const rawMsg = chatUpdate.messages[0];
            if (!rawMsg?.message || rawMsg.key?.remoteJid === 'status@broadcast') return;

            const type = Object.keys(rawMsg.message)[0];
            if (['protocolMessage', 'reactionMessage', 'pollUpdateMessage'].includes(type)) return;

            if (chatUpdate.type !== 'notify') return;

            const m = await smsg(sock, rawMsg);
            
            // --- CARGAMOS LOS DATOS DEL USUARIO EN LA DB ---
            loadDatabase(m);

            const prefixes = ['.', '#', '/', ','];
            const hasPrefix = prefixes.some(p => m.text?.startsWith(p));
            
            if (!m.text || !hasPrefix) return;

            console.log(chalk.blue(`[DEBUG] Comando: ${m.text} | Usuario: ${m.pushName}`));

            await main(sock, m, chatUpdate);
            
        } catch (err) {
            if (!err.message.includes('split')) {
                console.error(chalk.red.bold("[!] ERROR:"), err.message);
            }
        }
    });
}

(async () => {
    await startBot();
})();
