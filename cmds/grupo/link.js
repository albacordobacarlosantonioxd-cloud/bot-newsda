var handler = async (m, { conn }) => {
    try {
        const code = await conn.groupInviteCode(m.chat)
        m.reply(`https://chat.whatsapp.com/${code}`)
    } catch (e) {
        m.reply('❌ No pude obtener el link. ¿Soy administrador?')
    }
}
handler.command = ['link', 'enlace']
handler.group = true
handler.botAdmin = true

export default handler
