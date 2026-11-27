import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { stripEmojis } from './text.js'

const silentLogger = { info: () => {}, error: () => {}, warn: () => {} };

function unwrapMessage(message) {
    let content = message || {};
    for (let i = 0; i < 6; i++) {
        const wrapped = content.ephemeralMessage?.message
            || content.viewOnceMessageV2?.message
            || content.viewOnceMessageV2Extension?.message
            || content.viewOnceMessage?.message
            || content.documentWithCaptionMessage?.message;
        if (!wrapped) break;
        content = wrapped;
    }
    return content;
}

function normalizeJid(jid) {
    return typeof jid === 'string' ? jid.replace(/:\d+@/, '@') : '';
}

function contextInfoFor(message) {
    const content = unwrapMessage(message);
    return Object.values(content).find(value => value?.contextInfo)?.contextInfo;
}

function makeDownloadableMessage(rawMessage, conn) {
    return () => downloadMediaMessage(rawMessage, 'buffer', {}, {
        logger: silentLogger,
        reuploadRequest: conn.updateMediaMessage?.bind(conn)
    });
}

export async function smsg(conn, m) {
    if (!m) return m;
    const M = m.messages ? m.messages[0] : m;
    if (!M.message) return m;

    const content = unwrapMessage(M.message);
    const key = M.key || {};
    m.id = key.id;
    m.chat = key.remoteJid;
    m.fromMe = Boolean(key.fromMe);
    m.isGroup = Boolean(m.chat?.endsWith('@g.us'));
    m.sender = m.fromMe
        ? normalizeJid(conn.user?.id)
        : (m.isGroup ? key.participant : m.chat);
    m.type = Object.keys(content)[0];
    m.isReaction = m.type === 'reactionMessage';
    m.msg = content[m.type];
    m.text = m.isReaction ? '' : (
        content.conversation ||
        m.msg?.text ||
        m.msg?.caption ||
        ''
    );
    m.mentionedJid = contextInfoFor(content)?.mentionedJid || [];
    m.download = makeDownloadableMessage(M, conn);

    const contextInfo = contextInfoFor(content);
    if (contextInfo?.quotedMessage) {
        const quotedMessage = contextInfo.quotedMessage;
        const quotedContent = unwrapMessage(quotedMessage);
        const quotedType = Object.keys(quotedContent)[0];
        const participant = contextInfo.participant || (m.isGroup ? '' : m.chat);
        const quotedKey = {
            remoteJid: m.chat,
            fromMe: normalizeJid(participant) === normalizeJid(conn.user?.id),
            id: contextInfo.stanzaId,
            participant: m.isGroup ? participant : undefined
        };
        const rawQuoted = { key: quotedKey, message: quotedMessage };

        m.quoted = {
            key: quotedKey,
            id: contextInfo.stanzaId,
            chat: m.chat,
            sender: participant,
            fromMe: quotedKey.fromMe,
            message: quotedMessage,
            type: quotedType,
            msg: quotedContent[quotedType],
            mimetype: quotedContent[quotedType]?.mimetype || '',
            text: quotedContent.conversation || quotedContent[quotedType]?.text || quotedContent[quotedType]?.caption || '',
            download: makeDownloadableMessage(rawQuoted, conn)
        };
    } else {
        m.quoted = null;
    }

    m.reply = text => conn.sendMessage(m.chat, { text: stripEmojis(text) }, { quoted: m });
    m.react = async () => {};

    return m;
}
