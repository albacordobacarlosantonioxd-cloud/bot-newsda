import axios from 'axios'

/**
 * 🎵 COMANDO: Lyrics (Buscador de letras con Key)
 * 📝 DESCRIPCIÓN: Busca la letra de tus canciones favoritas usando Stellar API.
 * 👤 CREADOR: Charly Developer
 */

var handler = async (m, { conn, text, usedPrefix, command }) => {
    // 🔑 CONFIGURA TU KEY AQUÍ
    const stellarKey = 'api-wXCo4'

    if (!text) return m.reply(`✨ *Ingresa el nombre de la canción.*\nEjemplo: *${usedPrefix + command} Lose Yourself*`)

    await m.react('🎵')

    try {
        // Intentamos primero con Lyrics V2 (Requiere Key generalmente)
        const apiUrlV2 = `https://api.stellarwa.xyz/tools/lyricsv2?text=${encodeURIComponent(text)}&key=${stellarKey}`
        const res = await axios.get(apiUrlV2)
        
        let data = res.data.status ? res.data.result : null

        // Respaldo con la V1 si la V2 no devuelve nada
        if (!data) {
            const apiUrlV1 = `https://api.stellarwa.xyz/tools/lyrics?text=${encodeURIComponent(text)}&key=${stellarKey}`
            const resV1 = await axios.get(apiUrlV1)
            data = resV1.data.status ? resV1.data.result : null
        }

        if (!data) throw new Error('No se encontró la letra o la Key es inválida.')

        let txt = `┏━━━━━━━━━━━━━━━━━━━━┓\n`
        txt += `┃  🎵 *LETRA DE CANCIÓN* ┃\n`
        txt += `┗━━━━━━━━━━━━━━━━━━━━┛\n\n`
        txt += `📌 *Título:* ${data.title || text}\n`
        txt += `👤 *Artista:* ${data.artist || 'Desconocido'}\n\n`
        txt += `────────────────────\n\n`
        txt += `${data.lyrics}\n\n`
        txt += `────────────────────\n`
        txt += `⚡ *𝘽𝙮: Charly Developer*`

        if (data.image) {
            await conn.sendMessage(m.chat, { image: { url: data.image }, caption: txt }, { quoted: m })
        } else {
            await m.reply(txt)
        }

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('⚠️ *Error:* Verifica tu API Key o intenta con otra canción.')
    }
}

handler.help = ['lyrics <canción>']
handler.tags = ['tools']
handler.command = ['lyrics', 'letra', 'lyric']

export default handler
