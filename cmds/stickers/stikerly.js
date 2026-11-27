import { evoGet } from '../../core/evogb.js'

var handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*🏮 [ SISTEMA Charly ]*\n\n*¿Qué stickers buscas?*\n*Ejemplo:* ${usedPrefix + command} Flork o enlace de Sticker.ly`)

    const isUrl = text.match(/sticker.ly/gi)
    await m.react('📦')

    if (isUrl) {
        // --- MODO DETALLE/DESCARGA ---
        try {
            const data = await evoGet('/stickerly/detail', { url: text })
            if (!data.status) return m.reply('❌ No se pudo obtener el detalle de este paquete.')

            const res = data.result
            let txt = `┏━━━━━━━━━━━━━━━━┓\n`
            txt += `┃   ✨ *STICKER PACK* ┃\n`
            txt += `┗━━━━━━━━━━━━━━━━┛\n\n`
            txt += `🏷️ *Nᴏᴍʙʀᴇ:* ${res.name}\n`
            txt += `👤 *Aᴜᴛᴏʀ:* ${res.author}\n`
            txt += `📦 *Cᴀɴᴛɪᴅᴀᴅ:* ${res.stickers.length}\n\n`
            txt += `> *Enviando los primeros 10 stickers...*\n`
            txt += `━━━━━━━━━━━━━━━━━━━━\n`
            txt += `⚡ *𝘽𝙮 Charly Developer*`

            await m.reply(txt)

            // Enviamos los primeros 10 stickers para no saturar el chat
            for (let s of res.stickers.slice(0, 10)) {
                await conn.sendMessage(m.chat, { sticker: { url: s } }, { quoted: m })
            }
            await m.react('✅')

        } catch (e) {
            await m.react('❌')
            m.reply('⚠️ Error al descargar el paquete de stickers.')
        }

    } else {
        // --- MODO BÚSQUEDA ---
        try {
            const data = await evoGet('/stickerly/search', { query: text })
            if (!data.status || data.result.length === 0) return m.reply('❌ No se encontraron paquetes de stickers.')

            let results = data.result.slice(0, 5) // Top 5
            let txt = `┏━━━━━━━━━━━━━━━━┓\n`
            txt += `┃   🔎 *STICKER SEARCH* ┃\n`
            txt += `┗━━━━━━━━━━━━━━━━┛\n\n`
            txt += `📌 *Búsqueda:* ${text}\n\n`

            for (let i = 0; i < results.length; i++) {
                txt += `*${i + 1}.* ${results[i].name}\n`
                txt += `👤 *Autor:* ${results[i].author}\n`
                txt += `🔗 *Link:* ${results[i].url}\n`
                txt += `━━━━━━━━━━━━━━━━━━━━\n`
            }
            
            txt += `\n> *Usa el comando con el link para descargar.*\n⚡ *By Charly Developer*`

            await conn.sendMessage(m.chat, { 
                image: { url: results[0].stickers[0] }, // Portada del primer resultado
                caption: txt 
            }, { quoted: m })
            await m.react('✅')

        } catch (e) {
            await m.react('❌')
            m.reply('⚠️ Error en la búsqueda de Sticker.ly.')
        }
    }
}

handler.help = ['stickerly', 'stly']
handler.tags = ['sticker']
handler.command = ['stickerly', 'stly', 'ssearch']

export default handler
