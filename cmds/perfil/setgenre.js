var handler = async (m, { text, user }) => {
    if (!text) return m.reply(`¿Cuál es tu género? Ejemplo: *.setgenre Hombre*`)
    user.genero = text
    m.reply(`✅ Género actualizado: *${text}*`)
}
handler.command = ['setgenre']
export default handler
