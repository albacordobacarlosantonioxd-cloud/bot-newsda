var handler = async (m, { user }) => {
    user.genero = 'No definido'
    m.reply(`✅ Tu género ha sido eliminado.`)
}
handler.command = ['delgenre']
export default handler
