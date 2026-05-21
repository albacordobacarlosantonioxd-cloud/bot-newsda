var handler = async (m, { text, user }) => {
    if (!text) return m.reply(`¿Cuál es tu pasatiempo? Ejemplo: *.sethobby Jugar Free Fire*`)
    user.pasatiempo = text
    m.reply(`✅ Pasatiempo actualizado: *${text}*`)
}
handler.command = ['sethobby']
export default handler
