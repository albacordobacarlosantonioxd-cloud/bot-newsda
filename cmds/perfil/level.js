import { xpRange } from '../core/system/initdb.js'

var handler = async (m, { conn }) => {
    // 1. Obtenemos el usuario de la base de datos global usando su ID
    let who = m.sender
    let user = global.db.data.users[who]

    // 2. Verificamos que el usuario exista en la DB para evitar errores
    if (!user) return m.reply('❌ No se encontraron datos de usuario.')

    // 3. Calculamos el rango de XP basado en el nivel actual
    // Usamos || 0 por si el nivel es undefined
    let { min, max, xp } = xpRange(user.level || 0)

    // 4. Armamos el texto
    // Ojo: usa user.exp o user.xp según como lo tengas guardado en tu initdb
    let txt = `📈 *NIVEL ACTUAL*\n\n`
    txt += `✨ *Nivel:* ${user.level || 0}\n`
    txt += `📊 *Progreso:* ${user.exp || 0} / ${max}\n`
    txt += `🚀 *Faltan:* ${max - (user.exp || 0)} XP para el siguiente nivel`

    m.reply(txt)
}

handler.command = ['level', 'lvl']
export default handler
