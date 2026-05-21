var handler = async (m, { text, user }) => {
    if (!text) return m.reply(`¿Cuál es tu fecha de nacimiento? Ejemplo: *.setbirth 15 de Octubre*`)
    user.birth = text
    m.reply(`✅ Fecha de nacimiento actualizada: *${text}*`)
}
handler.command = ['setbirth']
export default handler
