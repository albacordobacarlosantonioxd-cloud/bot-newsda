var handler = async (m, { user }) => {
    user.pasatiempo = 'No definido'
    m.reply(`✅ Tu pasatiempo ha sido eliminado.`)
}
handler.command = ['delhobby']
export default handler
