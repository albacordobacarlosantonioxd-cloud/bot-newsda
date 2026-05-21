import fetch from "node-fetch"

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const dev = "𝘽𝙮 carlos"
    const chn = "Charly 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧𝙨"
    const key = "sasuke" 

    if (!text) return conn.reply(m.chat, `*🔍 ¿Qué imágenes deseas buscar?*\n*Ejemplo:* ${usedPrefix + command} Messi`, m)

    // Usamos el m.react que inyectamos en smsg
    await m.react('🔍')

    try {
        let res = await fetch(`https://api.evogb.org/search/googleimage?query=${encodeURIComponent(text)}&key=${key}`)
        let json = await res.json()

        if (!json.status || !json.result || json.result.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, '🛑 No encontré imágenes.', m)
        }

        // Seleccionamos 5 imágenes al azar
        let results = json.result.sort(() => 0.5 - Math.random()).slice(0, 5)
        
        for (let data of results) {
            let caption = `「 🖼️ Charly 𝙸𝙼𝙰𝙶𝙴𝚂 」\n`
            caption += `─── 🕒 ☆ : .☽ . : ☆ 🕒 ───\n`
            caption += `│ 📌 *𝚃𝙸𝚃𝚄𝙻𝙾:* ${data.title}\n`
            caption += `│ 🔍 *𝙱𝚄𝚂𝚀𝚄𝙴𝙳𝙰:* ${text.toUpperCase()}\n`
            caption += `─── 🕒 ☆ : .☽ . : ☆ 🕒 ───\n\n`
            caption += `⚡ *Code creado por ${dev}*\n`
            caption += `📡 *Disfruta el código de ${dev} x ${chn}*`

            await conn.sendMessage(m.chat, { image: { url: data.image }, caption: caption }, { quoted: m })
        }

        await m.react('✅')

    } catch (error) {
        console.error(error)
        await m.react('❌')
        conn.reply(m.chat, '⚠️ Error en el servidor.', m)
    }
}

handler.help = ['imagen <texto>']
handler.tags = ['internet']
// Cambiado a array para que tu loader.js lo encuentre fácil
handler.command = ['googleimage', 'img', 'imagen', 'foto'] 

export default handler
