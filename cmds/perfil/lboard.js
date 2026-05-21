var handler = async (m, { db }) => {
    let users = Object.entries(db.users).map(([key, value]) => ({ ...value, jid: key }))
    let sorted = users.sort((a, b) => (b.exp || 0) - (a.exp || 0))
    let top = sorted.slice(0, 10)
    
    let text = `🏆 *TOP 10 USUARIOS MÁS ACTIVOS* 🏆\n\n`
    text += top.map((u, i) => {
        let name = u.name || 'Usuario'
        return `${i + 1}. ${name} — *Lvl ${u.level || 0}* (${(u.exp || 0).toLocaleString()} XP)`
    }).join('\n')

    m.reply(text)
}
handler.command = ['lb', 'leaderboard', 'top']
export default handler
