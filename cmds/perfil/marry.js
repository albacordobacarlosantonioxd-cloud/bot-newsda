let proposals = {}
var handler = async (m, { conn, user, db, text }) => {
    let who = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
    if (!who) return m.reply('💍 Menciona a la persona con la que te quieres casar.')
    
    if (user.marry) return m.reply(`¡Ya estás casado! No seas infiel.`)
    if (db.users[who]?.marry) return m.reply('Esa persona ya está comprometida.')

    if (proposals[who] === m.sender) {
        delete proposals[who]
        user.marry = who
        db.users[who].marry = m.sender
        return m.reply(`💍 ¡Felicidades! Han aceptado la propuesta. Ahora están casados.`)
    }

    proposals[m.sender] = who
    m.reply(`💍 *@${m.sender.split('@')[0]}* le ha propuesto matrimonio a *@${who.split('@')[0]}*.\n\nPara aceptar, la otra persona debe escribir el comando y mencionarte.`, null, { mentions: [m.sender, who] })
}
handler.command = ['marry', 'casarse']
export default handler
