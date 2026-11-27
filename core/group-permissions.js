const ADMIN_ROLES = new Set(['admin', 'superadmin']);

function normalizeJid(jid) {
    return typeof jid === 'string' ? jid.replace(/:\d+@/, '@') : '';
}

function getParticipantJids(participant) {
    return [participant?.id, participant?.jid, participant?.lid]
        .map(normalizeJid)
        .filter(Boolean);
}

export function getGroupPermissions(participants = [], userJid, botJid) {
    const admins = new Set();
    for (const participant of participants) {
        if (!ADMIN_ROLES.has(participant?.admin)) continue;
        for (const jid of getParticipantJids(participant)) admins.add(jid);
    }

    return {
        isAdmin: admins.has(normalizeJid(userJid)),
        isBotAdmin: admins.has(normalizeJid(botJid))
    };
}

export async function getGroupPermissionContext(sock, chat, userJid, botJid) {
    try {
        const metadata = await sock.groupMetadata(chat);
        if (!Array.isArray(metadata?.participants)) {
            throw new Error('La metadata del grupo no incluye participantes válidos');
        }

        const participants = metadata.participants;
        return {
            participants,
            ...getGroupPermissions(participants, userJid, botJid),
            metadataError: null
        };
    } catch (error) {
        return {
            participants: [],
            isAdmin: false,
            isBotAdmin: false,
            metadataError: error instanceof Error ? error : new Error(String(error))
        };
    }
}