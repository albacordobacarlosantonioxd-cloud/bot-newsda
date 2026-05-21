var handler = async (m, { user, args }) => {
    user.afk = Date.now()
    user.afkReason = args.join(' ') || 'Sin especificar'
    const nombre = user.name || m.pushName
    m.reply(`ꕥ El Usuario *${nombre}* estará AFK.\n> ○ Motivo » *${user.afkReason}*`)
}
handler.help = ['afk']
handler.tags = ['main']
handler.command = ['afk']
export default handler
