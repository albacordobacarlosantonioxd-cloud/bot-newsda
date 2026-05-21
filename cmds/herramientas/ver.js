import * as baileys from "baileys";

var handler = async (m, { conn, mctx }) => {
    // 1. Verificamos si citaste un mensaje
    const quoted = m.quoted ? m.quoted : m.msg?.contextInfo?.quotedMessage;
    
    if (!quoted) {
        return m.reply("✨ *Responde a un mensaje de 'ver una sola vez' (view once) para revelarlo.*");
    }

    // 2. Intentamos descargar el contenido del mensaje citado
    try {
        const buffer = await baileys.downloadMediaMessage(
            m.quoted, 
            "buffer", 
            {}
        );

        // 3. Determinamos si es imagen o video
        const type = m.quoted.mimetype?.includes("image") ? "image" : "video";

        // 4. Enviamos el archivo revelado
        await conn.sendMessage(m.chat, {
            [type]: buffer,
            caption: "✨ *Contenido revelado con éxito.*"
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply("❌ *No pude revelar el mensaje. Asegúrate de responder a un archivo válido.*");
    }
}

handler.command = ['ver', 'revelar', 'vv'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
