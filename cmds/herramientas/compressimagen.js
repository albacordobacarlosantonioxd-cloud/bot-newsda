import axios from 'axios'
import { uploadToEvo } from '../../core/uploader.js' // Importamos tu uploader central

var handler = async (m, { conn }) => {
    // Detectamos si es una imagen enviada o una etiqueta (quoted)
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!/image/.test(mime)) return m.reply('✨ *Responde a una imagen para optimizarla.*')

    await m.react('📉')

    try {
        // 1. Descargamos la imagen de WhatsApp
        let imgBuffer = await q.download()
        
        // 2. Usamos tu función centralizada en core para obtener la URL
        const urlParaComprimir = await uploadToEvo(imgBuffer)
        
        if (!urlParaComprimir) throw new Error('Error al subir la imagen al servidor.')

        // 3. Petición a la API de compresión usando la URL generada
        const { data } = await axios.get(`https://api.evogb.org/tools/compress-image?url=${encodeURIComponent(urlParaComprimir)}&key=sasuke`)

        if (!data.status) return m.reply('❌ *La API no pudo procesar la imagen.*')

        const res = data.result
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📉 *OPTIMIZADO* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📦 *Aɴᴛᴇs:* ${res.oldSize}\n`
        info += `📉 *Aʜᴏʀᴀ:* ${res.newSize}\n`
        info += `✨ *Aʜᴏʀʀᴏ:* ${res.savePercentage}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // 4. Enviamos la imagen comprimida de vuelta
        await conn.sendMessage(m.chat, { 
            image: { url: res.url }, 
            caption: info 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Ocurrió un fallo al intentar comprimir la imagen.*')
    }
}

handler.help = ['comprimir']
handler.tags = ['tools']
handler.command = ['comprimir', 'compress', 'opti']

export default handler
