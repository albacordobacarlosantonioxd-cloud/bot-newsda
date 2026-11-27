var handler = async (m, { db }) => {
    const userId = m.sender
    const partnerId = db.users[userId]?.marry
    
    if (!partnerId) return m.reply('《✧》 Tú no estás casado con nadie.')
    
    db.users[userId].marry = ''
    db.users[partnerId].marry = ''
    
    return m.reply(`✎ *${db.users[userId]?.name || userId.split('@')[0]}* te has divorciado de *${db.users[partnerId]?.name || partnerId.split('@')[0]}*.`)
}

handler.help = ['divorce']
handler.tags = ['rpg']
handler.command = ['divorce', 'divorciar']

export default handler
