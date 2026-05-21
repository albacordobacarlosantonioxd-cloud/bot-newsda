import axios from 'axios'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let prompt = text ? text.trim() : (m.quoted?.text || null)
    if (!prompt) return m.reply(`✨ *Describe la imagen que quieres crear*\n\n> *Ejemplo:* ${usedPrefix + command} una Yamaha MT-09 modificada color negro mate`)

    await m.react('🎨')

    try {
        // Usamos el endpoint de imagen con la key que ya sabemos que te funciona
        const url = `https://api.evogb.org/ai/text2img?prompt=${encodeURIComponent(prompt)}&key=sasuke`
        
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 })

        if (!response.data || response.data.length < 100) {
            throw new Error('Respuesta de API inválida o imagen vacía')
        }

        let info = `┏━━━━━━━━━━━━━━━━┓\n`
        info += `┃   🎨 *AI GENERATOR* ┃\n`
        info += `┗━━━━━━━━━━━━━━━━┛\n\n`
        info += `💡 *Pʀᴏᴍᴘᴛ:* ${prompt}\n\n`
        info += `━━━━━━━━━━━━━━━━━━━━\n`
        info += `⚡ *𝘽𝙮 Charly Developer*\n`
        info += `📡 *Charly Developers*`

        await conn.sendMessage(m.chat, { 
            image: response.data, 
            caption: info 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error("Error en Nanobanana:", e.message)
        await m.react('❌')
        m.reply('⚠️ *La Matrix está saturada:* El generador de imágenes no respondió. Intenta con un prompt más corto o espera un momento.')
    }
}

handler.help = ['nb', 'nanobanana']
handler.tags = ['ia']
handler.command = ['nb', 'nanobanana', 'img']

export default handler
