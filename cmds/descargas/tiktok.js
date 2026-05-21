import axios from 'axios';

var handler = async (m, { conn, text, usedPrefix, command }) => {
    // En tu formato, 'from' es m.chat y 'sock' es conn
    if (!text) return conn.sendMessage(m.chat, { text: `¿Qué buscamos? Ejemplo: ${usedPrefix + command} clips free fire` });

    const RAPID_KEY = "e774e5f65fmsh8a64771078f8baap19a40cjsn79a68c1e252f";
    const RAPID_HOST = "tiktok-scraper7.p.rapidapi.com";

    await m.react("🔍");

    try {
        const response = await axios.get(`https://${RAPID_HOST}/feed/search`, {
            params: { keywords: text, region: 'mx', count: '5' },
            headers: { 'x-rapidapi-key': RAPID_KEY, 'x-rapidapi-host': RAPID_HOST }
        });

        const videos = response.data.data;
        if (!videos || videos.length === 0) return conn.sendMessage(m.chat, { text: '❌ Sin resultados.' });

        for (let i = 0; i < videos.length; i++) {
            try {
                const videoUrl = videos[i].play;
                if (!videoUrl) continue;

                await conn.sendMessage(m.chat, { 
                    video: { url: videoUrl }, 
                    caption: `🎬 *Video [${i + 1}/5]*\n📌 ${videos[i].title || 'TikTok'}` 
                }, { quoted: m });

                // Delay para no saturar tu RAM de 4GB
                await new Promise(res => setTimeout(res, 4000));

            } catch (err) {
                console.log(`Error en video ${i}: ${err.message}`);
            }
        }
        await m.react("✅");

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, { text: '❌ Error de conexión con la API de TikTok.' });
    }
}

handler.help = ['tiktok']
handler.tags = ['descargas']
handler.command = ['tiktok', 'tt', 'tk']

export default handler
