var handler = async (m, { text, user }) => {
    if (!text) return m.reply(`¿Qué quieres poner en tu descripción? Ejemplo: *.setdesc Programador de CharlyBot*`)
    user.description = text
    m.reply(`✅ Descripción actualizada correctamente.`)
}
handler.command = ['setdesc', 'setdescription']
export default handler
