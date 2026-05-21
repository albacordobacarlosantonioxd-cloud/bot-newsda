import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let query = text ? text.trim() : (m.quoted?.text || null)
    if (!query) return m.reply(`✨ *Ingresa un enlace para descargar*\n\n> *Ejemplo:* ${usedPrefix + command} https://...`)

    await m.react('⏳')

    try {
        const key = "sasuke" 
        let endpoint = ''

        // 1. Identificamos el tipo de descarga
        if (/ig|instagram/i.test(command)) {
            endpoint = `https://api.evogb.org/dl/instagram?url=${encodeURIComponent(query)}&key=${key}`
        } else if (/fb|facebook/i.test(command)) {
            endpoint = `https://api.evogb.org/dl/facebook?url=${encodeURIComponent(query)}&key=${key}`
        }

        const { data } = await axios.get(endpoint)
        
        if (!data.status) {
            await m.react('❌')
            return m.reply('⚠️ *La API no devolvió un resultado válido.*')
        }

        let downloadUrl = ''
        let title = 'Archivo Multimedia'

        // 2. Extraemos la URL según la plataforma (CORREGIDO)
        if (/ig|instagram/i.test(command)) {
            // Instagram suele devolver un array en .data o .result
            downloadUrl = data.data?.[0]?.url || data.result?.[0]?.url
            title = 'Instagram Reel'
        } else if (/fb|facebook/i.test(command)) {
            // Facebook en EvoGB suele usar .result o .resultados
            downloadUrl = data.result?.[0]?.url || data.resultados?.[0]?.url || data.data?.[0]?.url
            title = 'Facebook Video'
        } // <--- AQUÍ FALTABA CERRAR LA LLAVE

        if (!downloadUrl) {
            await m.react('❌')
            return m.reply('⚠️ *No se pudo encontrar el enlace de descarga.*')
        }

        let ui = `┏━━━━━━━━━━━━━━━━┓\n`
        ui += `┃    📥 *DESCARGADOR* ┃\n`
        ui += `┗━━━━━━━━━━━━━━━━┛\n\n`
        ui += `📝 *INFO:* ${title}\n\n`
        ui += `━━━━━━━━━━━━━━━━━━━━\n`
        ui += `⚡ *𝘽𝙮 Charly Developer*\n`
        ui += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            video: { url: downloadUrl }, 
            caption: ui,
            mimetype: 'video/mp4'
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Ocurrió un error al conectar con la API.*')
    }
}

handler.help = ['ig', 'fb']
handler.tags = ['downloader']
handler.command = ['ig', 'instagram', 'fb', 'facebook']

export default handler
