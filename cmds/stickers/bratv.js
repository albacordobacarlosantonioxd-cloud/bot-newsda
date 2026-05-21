import axios from 'axios'
import { sticker } from '../core/stickers.js' // Ruta hacia tu nuevo core

var handler = async (m, { conn, text }) => {
    if (!text) return m.reply('❌ Escribe el texto para el sticker.')
    
    await m.react('🕒')
    
    try {
        const url = `https://skyzxu-brat.hf.space/brat-animated?text=${encodeURIComponent(text)}`
        const res = await axios.get(url, { responseType: 'arraybuffer' })
        
        // Llamamos a tu nuevo motor de stickers
        const stiker = await sticker(Buffer.from(res.data), 'Charly-Bot', 'Carlos Alba')
        
        if (stiker) {
            await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
            await m.react('✅')
        }
    } catch (e) {
        console.error(e)
        m.reply('⚠️ Error al generar el sticker. Asegúrate de tener ffmpeg instalado en Zorin.')
    }
}

handler.command = ['bratv']
export default handler
