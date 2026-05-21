import fs from 'fs'
import path from 'path'

const captions = {
  anal: (from, to) => from === to ? 'se la metió en el ano.' : 'se la metió en el ano a',
  cum: (from, to) => from === to ? 'se vino dentro de... Omitiremos eso.' : 'se vino dentro de',
  undress: (from, to) => from === to ? 'se está quitando la ropa' : 'le está quitando la ropa a',
  fuck: (from, to) => from === to ? 'se entrega al deseo' : 'se está cogiendo a',
  spank: (from, to) => from === to ? 'está dando una nalgada' : 'le está dando una nalgada a',
  lickpussy: (from, to) => from === to ? 'está lamiendo un coño' : 'le está lamiendo el coño a',
  fap: (from, to) => from === to ? 'se está masturbando' : 'se está masturbando pensando en',
  grope: (from, to) => from === to ? 'se lo está manoseando' : 'se lo está manoseando a',
  sixnine: (from, to) => from === to ? 'está haciendo un 69' : 'está haciendo un 69 con',
  suckboobs: (from, to) => from === to ? 'está chupando unas ricas tetas' : 'le está chupando las tetas a',
  grabboobs: (from, to) => from === to ? 'está agarrando unas tetas' : 'le está agarrando las tetas a',
  blowjob: (from, to) => from === to ? 'está dando una rica mamada' : 'le dio una mamada a',
  boobjob: (from, to) => from === to ? 'esta haciendo una rusa' : 'le está haciendo una rusa a',
  footjob: (from, to) => from === to ? 'está haciendo una paja con los pies' : 'le está haciendo una paja con los pies a',
  yuri: (from, to) => from === to ? 'está haciendo tijeras!' : 'hizo tijeras con',
  cumshot: (from, to) => from === to ? 'se la metió a alguien y ahora viene el regalo' : 'le dio un regalo sorpresa a',
  handjob: (from, to) => from === to ? 'le da una paja a alguien con cariño' : 'le está haciendo una paja a',
  lickass: (from, to) => from === to ? 'saborea un culo sin detenerse' : 'le está lamiendo el culo a',
  lickdick: (from, to) => from === to ? 'chupa con ganas un pene' : 'se la mete todo en la boca para',
  fingering: (from, to) => from === to ? 'se está metiendo los dedos' : 'le está metiendo los dedos a',
  creampie: (from, to) => from === to ? 'terminó dentro sin avisar...' : 'terminó dentro de',
  facesitting: (from, to) => from === to ? 'está sentándose en una cara' : 'se sentó en la cara de',
  deepthroat: (from, to) => from === to ? 'se la traga hasta el fondo' : 'le está haciendo una garganta profunda a',
  thighjob: (from, to) => from === to ? 'está frotando entre los muslos' : 'le está haciendo una entre piernas a',
  bondage: (from, to) => from === to ? 'está atado y sin escapatoria...' : 'ató bien amarrado a',
  pegging: (from, to) => from === to ? 'está recibiendo lo que no esperaba' : 'le está dando por detrás a',
  futanari: (from, to) => from === to ? 'tiene lo mejor de los dos mundos' : 'le demostró lo que tiene a',
  yaoi: (from, to) => from === to ? 'está disfrutando de un momento muy intenso' : 'se lo pasó genial con',
  bukkake: (from, to) => from === to ? 'terminó solo... de una forma muy especial' : 'invitó a sus amigos a acabar encima de',
  orgy: (from, to) => from === to ? 'está en una orgía' : 'organizó una orgía con',
  squirting: (from, to) => from === to ? 'llegó al límite y se vino con todo' : 'la llevó al límite hasta que se vino con todo'
};

var handler = async (m, { conn, command, chat, text }) => {
    if (m.isGroup && !chat.nsfw) return m.reply('*🏮 [ SISTEMA ]*\n\nActiva el modo NSFW primero.')

    const jsonPath = path.join(process.cwd(), 'core', 'nsfw.json')
    const nsfwData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const category = command.toLowerCase()

    try {
        const links = nsfwData[category]
        const randomLink = links[Math.floor(Math.random() * links.length)]

        // 1. Identificar al objetivo de forma agresiva
        let who;
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            who = m.mentionedJid[0];
        } else if (m.quoted) {
            who = m.quoted.sender;
        } else if (text && text.includes('@')) {
            who = text.split('@')[1].trim().split(' ')[0] + '@s.whatsapp.net';
        } else {
            who = m.sender;
        }

        // 2. IDs limpios para la comparación lógica
        const fromId = m.sender.split('@')[0]
        const targetId = who.split('@')[0]

// 3. --- LÓGICA DE NOMBRE MEJORADA ---
        let nameFrom = m.pushName || 'Charly'
        let nameTo;

        // Caso A: Es el bot
        if (targetId.includes('19749014659309')) {
            nameTo = 'Charly bot';
        } 
        // Caso B: Es un usuario con mensaje citado (podemos sacar su nombre de ahí)
        else if (m.quoted && m.quoted.sender === who && m.quoted.pushName) {
            nameTo = m.quoted.pushName;
        }
        // Caso C: No tenemos nombre, limpiamos el número para que no se vea el JID feo
        else {
            // Esto quita códigos de país raros y deja el número más limpio
            // Opcional: puedes poner nameTo = 'alguien' si prefieres no mostrar números
            nameTo = `@${targetId.replace(/\D/g, '')}`; 
        }

        // 4. Generar la frase
        let fraseInteraccion = captions[category] ? captions[category](fromId, targetId) : `hizo ${category}`
        
        // 5. Construcción del texto (Quitamos el @ antes de targetId si ya es un nombre)
        let finalTxt = ""
        if (fromId === targetId) {
            finalTxt = `🔥 *${nameFrom}* ${fraseInteraccion}`
        } else {
            // Usamos asteriscos para que resalte en negrita
            finalTxt = `🔥 *${nameFrom}* ${fraseInteraccion} *${nameTo}*`
        }

        const isVideo = randomLink.endsWith('.mp4')

        await conn.sendMessage(m.chat, { 
            [isVideo ? 'video' : 'image']: { url: randomLink }, 
            caption: finalTxt, 
            gifPlayback: isVideo,
            mentions: [m.sender, who] 
        }, { quoted: m })

    } catch (e) {
        console.error("Error en interacción:", e)
    }
}

handler.command = Object.keys(captions)
handler.tags = ['nsfw']
export default handler
