export async function smsg(conn, m) {
    if (!m) return m;
    let M = m.messages ? m.messages[0] : m;
    if (!M.message) return m;

    if (M.key) {
        m.id = M.key.id;
        m.chat = M.key.remoteJid;
        m.fromMe = M.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (m.isGroup ? M.key.participant : m.chat);
    }

    // --- IDENTIFICAR EL TIPO REAL ---
    m.type = Object.keys(M.message)[0];
    
    // Si es una reacción, lo marcamos clarito
    m.isReaction = m.type === 'reactionMessage';
    
    m.msg = M.message[m.type];

    // Extraer texto solo si NO es reacción
    m.text = m.isReaction ? "" : (
        M.message.conversation || 
        m.msg?.text || 
        m.msg?.caption || 
        ""
    );

    // --- FUNCIONES DE ACCESO RÁPIDO (SUPERPODERES) ---

    // Función para responder
    m.reply = (text) => conn.sendMessage(m.chat, { text: text }, { quoted: m });

    // Función para reaccionar (ESTA ES LA QUE TE FALTABA)
    m.react = (emoji) => conn.sendMessage(m.chat, { 
        react: { 
            text: emoji, 
            key: m.key 
        } 
    });

    return m;
}
