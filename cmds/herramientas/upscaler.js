mport axios from 'axios'
import { uploadToEvo } from '../../core/uploader.js'

var handler = async (m, { conn }) => {
    // Detectamos si es una imagen directa o una etiqueta (quoted)
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!/image/.test(mime)) return m.reply('✨ *Responde a una imagen para mejorar su calidad (HD).*')

    await m.react('🔥')

    try {
        // 1. Descargamos la imagen de WhatsApp
        let imgBuffer = await q.download()
        
        // 2. Subimos a tu motor en core para obtener la URL remota requerida por el endpoint
        const urlRemota = await uploadToEvo(imgBuffer)
        
        if (!urlRemota) throw new Error('Error al subir la imagen al servidor.')

        // 3. Petición a la API de Upscale
        const key = "sasuke"
        const apiUrl = `https://api.evogb.org/tools/upscale?url=${encodeURIComponent(urlRemota)}&key=${key}`

        const { data } = await axios.get(apiUrl)

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply('❌ *La API no pudo procesar esta imagen.*')
        }

        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   ✨ *UPSCALER HD* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `✅ *Resolución aumentada*\n`
        info += `🎨 *Detalles restaurados*\n`
        info += `⏱️ *Tiempo:* 5-15 seg\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // 4. Enviamos la imagen ya mejorada
        await conn.sendMessage(m.chat, { 
            image: { url: data.result.url }, 
            caption: info 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error en Upscale:", e.message)
        await m.react('❌')
        m.reply('⚠️ *Falló el proceso de mejora. Intenta con una imagen menos pesada.*')
    }
}

handler.help = ['upscale', 'hd']
handler.tags = ['tools']
handler.command = ['upscale', 'hd', 'remini', 'mejorar']

export default handler
