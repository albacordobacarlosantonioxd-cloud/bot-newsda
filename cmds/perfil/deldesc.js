var handler = async (m, { user }) => {
    user.description = 'Sin descripción'
    m.reply(`✅ Tu descripción ha sido reiniciada.`)
}
handler.command = ['deldesc', 'deldescription']
export default handler
