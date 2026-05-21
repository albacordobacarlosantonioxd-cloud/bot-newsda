import axios from 'axios'
import { uploadToEvo } from '../../core/uploader.js'

var handler = async (m, { conn }) => {
    // Detectamos si el usuario etiquetó un documento PDF
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!/pdf/.test(mime)) return m.reply('✨ *Responde a un archivo PDF para optimizarlo.*')

    await m.react('📉')

    try {
        // 1. Descargamos el PDF desde WhatsApp
        let pdfBuffer = await q.download()
        
        // 2. Subimos el archivo usando tu motor en core para obtener la URL remota
        const urlRemota = await uploadToEvo(pdfBuffer)
        
        if (!urlRemota) throw new Error('Error al subir el PDF al servidor.')

        // 3. Petición a la API de compresión de PDF
        // Según tu captura, usamos el método de enlace remoto
        const { data } = await axios.get(`https://api.evogb.org/tools/compress-pdf?url=${encodeURIComponent(urlRemota)}&key=sasuke`)

        if (!data.status) return m.reply('❌ *La API no pudo procesar este PDF.*')

        const res = data.result
        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   📑 *PDF OPTIMIZADO* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `📄 *Aɴᴛᴇs:* ${res.oldSize}\n`
        info += `📉 *Aʜᴏʀᴀ:* ${res.newSize}\n`
        info += `✨ *Aʜᴏʀʀᴏ:* ${res.savePercentage}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*`

        // 4. Enviamos el PDF comprimido de vuelta como documento
        await conn.sendMessage(m.chat, { 
            document: { url: res.url }, 
            fileName: res.fileName || 'documento_optimizado.pdf',
            mimetype: 'application/pdf',
            caption: info 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Falló la compresión. El archivo podría ser demasiado pesado o estar protegido.*')
    }
}

handler.help = ['comprimirpdf']
handler.tags = ['tools']
handler.command = ['comprimirpdf', 'compdf', 'optipdf']

export default handler
