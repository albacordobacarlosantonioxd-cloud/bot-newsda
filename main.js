import "./settings.js";
import { getCommand } from "./core/loader.js"; 
import { addExperience, normalizeDatabase } from "./core/system/initdb.js";
import { getGroupPermissionContext } from "./core/group-permissions.js";
import { isDuplicateMessage } from "./core/message-dedupe.js";
import { sanitizeMessagePayload } from "./core/text.js";
import audioStickerHandler from "./cmds/stickers/audiosticker.js";
import chalk from "chalk";

function createCommandConnection(sock) {
    return new Proxy(sock, {
        get(target, property) {
            const value = Reflect.get(target, property, target);
            if (property === 'sendMessage' && typeof value === 'function') {
                return (jid, content, options) => value.call(target, jid, sanitizeMessagePayload(content), options);
            }
            if (property === 'reply' && typeof value === 'function') {
                return (jid, text, ...args) => value.call(target, jid, sanitizeMessagePayload(text), ...args);
            }
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
}

export default async function main(sock, m, chatUpdate) {
    global.charlyHandler = main;

    try {
        if (!m || m.type === 'reactionMessage' || m.type === 'protocolMessage') return;
        if (isDuplicateMessage(m)) return;
        const commandConn = createCommandConnection(sock);
        if (await audioStickerHandler.before?.(m, { conn: commandConn })) return;
        // ... (todo el resto de tu código igualito abajo)

        // --- 1. ASEGURAR BASE DE DATOS ---
        if (!global.db || global.db.data || !global.db.users || !global.db.chats || !global.db.stats || !global.db.settings) {
            global.db = normalizeDatabase(global.db);
        }
        const db = global.db;

        // --- 2. REGISTRO DE USUARIO Y CHAT ---
        if (!db.users[m.sender]) {
            db.users[m.sender] = { exp: 0, level: 0, comandos: 0, afk: -1, afkReason: '', lastwork: 0, money: 0 };
        }
        let user = db.users[m.sender];

        if (m.isGroup && !db.chats[m.chat]) {
            db.chats[m.chat] = { welcome: true, antiLink: false, isBanned: false, nsfw: false };
        }
        let chat = m.isGroup ? db.chats[m.chat] : {};

        const rawText = m.text || m.body || "";
        const dict = rawText.trim();
        
        // --- 3. LÓGICA AFK ---
        if (user && user.afk > -1) {
            let tiempoAfk = Math.floor((Date.now() - user.afk) / 60000);
            let afkMsg = `Bienvenido de vuelta *@${m.sender.split('@')[0]}*\n> Estuviste inactivo *${tiempoAfk} minutos*.`;
            await sock.sendMessage(m.chat, { text: afkMsg, mentions: [m.sender] }, { quoted: m });
            user.afk = -1;
            user.afkReason = '';
        }

        // --- 4. DETECTOR DE COMANDOS ---
        const prefixes = global.prefixes || ['.', '/', ',', '#'];
        const usedPrefix = prefixes.find(p => dict.startsWith(p));
        
        // Si no tiene prefijo, no hacemos nada más
        if (!usedPrefix) return;
        console.log(chalk.blue(`[DEBUG] Comando: ${dict} | Usuario: ${m.pushName}`));

        const noPrefixText = dict.slice(usedPrefix.length).trim();
        const commandName = noPrefixText.split(' ')[0].toLowerCase();
        const text = noPrefixText.slice(commandName.length).trim();
        const args = text.split(/ +/).filter(v => v);

        // 5. BUSCAR ARCHIVO
        const commandFile = await getCommand(commandName);
        
        if (commandFile) {
            // Verificación de baneos
            if (user?.banned) return; 
            if (m.isGroup && chat?.isBanned) return; 

            // --- 6. PERMISOS Y ROLES ---
            const numberBot = sock.user.id?.includes('@')
                ? sock.user.id
                : `${sock.user.id?.split(':')[0]}@s.whatsapp.net`;
            const ownerList = Array.isArray(global.owner) ? global.owner : [];
            const normalizeJid = jid => typeof jid === 'string' ? jid.replace(/:\d+@/, '@') : '';
            const ownerJids = ownerList.map(v => {
                const owner = Array.isArray(v) ? v[0] : v;
                return String(owner).includes('@') ? owner : `${String(owner).replace(/[^0-9]/g, '')}@s.whatsapp.net`;
            });
            const isOwner = [numberBot, ...ownerJids].some(jid => normalizeJid(jid) === normalizeJid(m.sender));
            
            const groupPermissions = m.isGroup
                ? await getGroupPermissionContext(sock, m.chat, m.sender, numberBot)
                : { participants: [], isAdmin: false, isBotAdmin: false, metadataError: null };
            const { participants, isAdmin: isAdmins, isBotAdmin: isBotAdmins, metadataError } = groupPermissions;

            if (commandFile.group && !m.isGroup) return m.reply('⚠️ Este comando solo se puede usar en grupos.');
            if (metadataError && ((commandFile.admin && !isOwner) || commandFile.botAdmin)) {
                console.error('[GROUP] No se pudo verificar la metadata del grupo:', metadataError.message);
                return m.reply('⚠️ No pude verificar los permisos del grupo. Inténtalo de nuevo más tarde.');
            }
            if (commandFile.admin && !(isOwner || isAdmins)) return m.reply('✨ *Solo administradores del grupo.*');
            if (commandFile.botAdmin && !isBotAdmins) return m.reply('⚠️ Necesito ser *administrador del grupo* para ejecutar este comando.');

            // --- 7. RECOMPENSAS POR COMANDO ---
            addExperience(user, 10)
            user.comandos = (user.comandos || 0) + 1;       
            db.stats.totalCommands = (db.stats.totalCommands || 0) + 1; 

            // --- 8. EJECUCIÓN ---
            console.log(chalk.green(`[EXE] ${commandName} | Por: ${m.sender.split('@')[0]}`));
            
            const runMethod = commandFile.handler || commandFile.run || (typeof commandFile === 'function' ? commandFile : null) || commandFile.default?.handler || commandFile.default?.run;

            if (typeof runMethod === 'function') {
                await runMethod(m, {
                    sock: commandConn, conn: commandConn, client: commandConn,
                    text, args, usedPrefix, command: commandName,
                    participants, isOwner, isAdmins, isBotAdmins,
                    isAdmin: isAdmins, isBotAdmin: isBotAdmins,
                    db: db,
                    user, chat  
                });
            }
        }
    } catch (err) {
        console.error(chalk.red.bold("[!] ERROR CRÍTICO:"), err);
    }
}
