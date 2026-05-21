import axios from 'axios'
import { uploadToEvo } from '../../core/uploader.js'

var handler = async (m, { conn }) => {
    // Detectamos si es imagen directa o una etiqueta (quoted)
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!/image/.test(mime)) return m.reply('✨ *Responde a una imagen para quitarle el fondo.*')

    await m.react('✂️')

    try {
        // 1. Descargamos la imagen de WhatsApp
        let imgBuffer = await q.download()
        
        // 2. Subimos a tu uploader en core para tener el link remoto
        const urlRemota = await uploadToEvo(imgBuffer)
        
        if (!urlRemota) throw new Error('Error al subir la imagen al servidor.')

        // 3. Llamada a la API de RemoveBG usando el enlace remoto
        const { data } = await axios.get(`https://api.evogb.org/tools/removebg?url=${encodeURIComponent(urlRemota)}&key=sasuke`)

        if (!data.status) return m.reply('❌ *La API no pudo procesar la imagen. Intenta con una foto más clara.*')

        // 4. Enviamos el resultado (la API devuelve la imagen ya sin fondo)
        await conn.sendMessage(m.chat, { 
            image: { url: data.result.url }, 
            caption: `✅ *Fondo eliminado correctamente*\n\n⚡ *By Charly Developer*` 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Ocurrió un fallo al intentar quitar el fondo. Verifica el formato de la imagen.*')
    }
}

handler.help = ['removebg', 'sinfondo']
handler.tags = ['tools']
handler.command = ['removebg', 'nobg', 'sinfondo', 'rbg']

export default handler
