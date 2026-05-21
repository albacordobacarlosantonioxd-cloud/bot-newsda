var handler = async (m, { conn, isOwner, isAdmin, command }) => {
    if (!(isOwner || isAdmin)) return m.reply('✨ *Solo administradores.*')
    const isClose = /close|cerrar/i.test(command)
    const type = isClose ? 'announcement' : 'not_announcement'
    
    try {
        await conn.groupSettingUpdate(m.chat, type)
        m.reply(`✅ Grupo ${isClose ? 'Cerrado' : 'Abierto'} con éxito.`)
    } catch (e) {
        m.reply('❌ Error. Asegúrate de que soy administrador.')
    }
}
handler.help = ['open', 'close']
handler.tags = ['group']
handler.command = ['open', 'abrir', 'close', 'cerrar']
handler.group = true
handler.botAdmin = true

export default handler
