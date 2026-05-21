import axios from 'axios'

// 1. Objeto de Captions SFW
const captions = {
  hug: (from, to) => from === to ? 'se está dando un auto-abrazo... qué tierno.' : 'le dio un gran abrazo a',
  pat: (from, to) => from === to ? 'se está dando palmaditas en la cabeza.' : 'está acariciando la cabeza de',
  kiss: (from, to) => from === to ? 'se dio un beso en el espejo.' : 'le dio un tierno beso a',
  slap: (from, to) => from === to ? 'se dio una bofetada a sí mismo... ¡reacciona!' : 'le dio una bofetada a',
  punch: (from, to) => from === to ? 'se está golpeando solo.' : 'le soltó un puñetazo a',
  wink: (from, to) => from === to ? 'está picando el ojo.' : 'le picó el ojo a',
  poke: (from, to) => from === to ? 'se está picando las costillas.' : 'le picó las costillas a',
  kill: (from, to) => from === to ? 'se aplicó la automorición.' : 'acabó con la vida de',
  dance: (from, to) => from === to ? 'se puso a bailar con su sombra.' : 'se puso a bailar con',
  cry: (from, to) => from === to ? 'se puso a llorar en un rincón.' : 'está llorando frente a',
  blush: (from, to) => from === to ? 'se sonrojó solito.' : 'se puso rojo por culpa de',
  smile: (from, to) => from === to ? 'está sonriendo feliz.' : 'le sonrió con mucha alegría a',
  wave: (from, to) => from === to ? 'está saludando a todos.' : 'le dijo hola a',
  highfive: (from, to) => from === to ? 'chocó las manos con el aire.' : 'chocó las palmas con',
  nom: (from, to) => from === to ? 'está comiendo muy rico.' : 'está comiendo con',
  bite: (from, to) => from === to ? 'se mordió la lengua.' : 'le dio una mordidita a',
  glare: (from, to) => from === to ? 'está mirando fijamente a la nada.' : 'está mirando con odio a',
  cuddle: (from, to) => from === to ? 'está acurrucado.' : 'se acurrucó con mucho cariño con',
  tickle: (from, to) => from === to ? 'se está haciendo cosquillas.' : 'le está haciendo muchas cosquillas a'
};

var handler = async (m, { conn, command }) => {
    const category = command.toLowerCase()
    const apikey = "api-wXCo4" // Tu key de Stellar

    try {
        // 2. Llamada a la API de Stellar (SFW)
        // Nota: Asegúrate de que la URL para SFW sea la correcta de Stellar, usualmente es /sfw/
        const { data } = await axios.get(`https://api.stellarwa.xyz/sfw/interaction?type=${category}&key=${apikey}`)

        if (!data.status || !data.url) {
            return m.reply(`❌ La categoría *${category}* no está disponible en Stellar o la Key falló.`)
        }

        // 3. Lógica de Menciones
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender
        let userFrom = `@${m.sender.split('@')[0]}`
        let userTo = `@${who.split('@')[0]}`

        // 4. Construir la frase
        let frase = captions[category] ? captions[category](m.sender, who) : `hizo ${category}`
        let finalTxt = m.sender === who ? `✨ *${userFrom}* ${frase}` : `✨ *${userFrom}* ${frase} *${userTo}*`

        // 5. Enviar el contenido (Sin reacciones)
        const isVideo = data.url.endsWith('.mp4') || data.url.includes('gif')
        
        await conn.sendMessage(m.chat, { 
            [isVideo ? 'video' : 'image']: { url: data.url }, 
            caption: finalTxt, 
            gifPlayback: isVideo,
            mentions: [m.sender, who].filter(v => v) 
        }, { quoted: m })

    } catch (e) {
        console.error(`Error en SFW Stellar:`, e.message)
        m.reply('⚠️ Error al conectar con Stellar.')
    }
}

handler.command = [
  'hug', 'pat', 'kiss', 'slap', 'punch', 'wink', 'poke', 'kill', 
  'dance', 'cry', 'blush', 'smile', 'wave', 'highfive', 'nom', 
  'bite', 'glare', 'cuddle', 'tickle'
]
handler.tags = ['sfw']

export default handler
