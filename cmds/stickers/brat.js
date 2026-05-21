import axios from 'axios'
import fs from 'fs'
import { exec } from 'child_process'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    let final = text ? text.trim() : (m.quoted?.text || null)
    
    if (!final) return m.reply(`⚡ *Escribe el contenido para tu sticker*\n\n> *Ejemplo:* ${usedPrefix + command} Charly-Bot`)

    if (final.length > 35) {
        return m.reply(`⚠️ *Demasiado largo.*\n\n📌 Máximo: *35 letras*`)
    }

    await m.react('🕒')

    try {
        const formatted = wrap(final, 28)
        // Key y URL de la API
        const key = "sylphy-6f150d"
        const url = `https://sylphyy.xyz/tools/brat?text=${encodeURIComponent(formatted)}&color=black&fondo=white&type=Nose&api_key=${key}`

        const res = await axios.get(url, { responseType: 'arraybuffer' })

        // Rutas temporales (usando la carpeta tmp de tu bot)
        const img = `./tmp/brat-${Date.now()}.png`
        const webp = `./tmp/brat-${Date.now()}.webp`
        
        fs.writeFileSync(img, res.data)


        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i ${img} -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" ${webp}`, (err) => {
                if (err) reject(err)
                else resolve()
            })
        })


        await conn.sendMessage(m.chat, { 
            sticker: fs.readFileSync(webp), 
            packname: "Charly-Bot 👤", 
            author: "Charly Developer x Zona Developers ⚡" 
        }, { quoted: m })

        await m.react('✔️')


        if (fs.existsSync(img)) fs.unlinkSync(img)
        if (fs.existsSync(webp)) fs.unlinkSync(webp)

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ Error al generar el sticker Brat.')
    }
}


function wrap(text, max = 22) {
    let words = text.split(' ')
    let lines = []
    let cur = []
    for (let w of words) {
        if ((cur.join(' ').length + w.length + 1) > max) {
            lines.push(cur.join(' '))
            cur = [w]
        } else {
            cur.push(w)
        }
    }
    if (cur.length) lines.push(cur.join(' '))
    return lines.join('\n')
}

handler.help = ['brat']
handler.tags = ['sticker']
handler.command = ['brat']

export default handler
