var handler = async (m, { user }) => {
    user.birth = 'No definido'
    m.reply(`✅ Tu fecha de nacimiento ha sido eliminada.`)
}
handler.command = ['delbirth']
export default handler
