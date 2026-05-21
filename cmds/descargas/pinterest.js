import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿Qué buscas en Pinterest?*\n*Ejemplo:* ${usedPrefix + command} MT-09 modificada o enlace de pin`)

    const isUrl = text.match(/pinterest.com|pin.it/gi)
    await m.react('⏳')

    if (isUrl) {
        // --- MODO DESCARGA ---
        try {
            const { data } = await axios.get(`https://api.evogb.org/dl/pinterest?url=${encodeURIComponent(text)}&key=sasuke`)
            if (!data.status) return m.reply('❌ No se pudo descargar el contenido de este enlace.')

            const res = data.result
            const isVideo = res.type === 'video'

            await conn.sendMessage(m.chat, { 
                [isVideo ? 'video' : 'image']: { url: res.url }, 
                caption: `✅ *Pinterest DL*` 
            }, { quoted: m })
            await m.react('✅')

        } catch (e) {
            await m.react('❌')
            m.reply('⚠️ Error al intentar descargar el Pin.')
        }

    } else {
        // --- MODO BÚSQUEDA (CON RESPALDO V2) ---
        try {
            let res = await axios.get(`https://api.evogb.org/search/pinterest?query=${encodeURIComponent(text)}&key=sasuke`)
            
            // Si la V1 no da resultados, intentamos con V2
            if (!res.data.status || res.data.data.length === 0) {
                res = await axios.get(`https://api.evogb.org/search/pinterestv2?query=${encodeURIComponent(text)}&key=sasuke`)
            }

            if (!res.data.status || !res.data.data) return m.reply('❌ No se encontraron imágenes.')

            let results = res.data.data.slice(0, 5) // Tomamos máximo 5
            
            await m.reply(`🔎 *Enviando ${results.length} resultados para:* ${text}`)

            for (let img of results) {
                await conn.sendMessage(m.chat, { image: { url: img } }, { quoted: m })
            }
            
            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            m.reply('⚠️ Error en la búsqueda de Pinterest.')
        }
    }
}

handler.help = ['pinterest', 'pin']
handler.tags = ['descargas', 'search']
handler.command = ['pinterest', 'pin', 'pinter']

export default handler
