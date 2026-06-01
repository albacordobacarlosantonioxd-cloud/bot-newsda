const handler = async (m, { conn }) => {
    const start = Date.now()
    
    const sent = await conn.sendMessage(m.chat, {
        text: '❏ *Pong!*'
    }, { quoted: m })

    const latency = Date.now() - start

    await conn.sendMessage(m.chat, {
        text: `✿ *Pong!*\n\n> *Tiempo de respuesta:* ${latency}ms`,
        edit: sent.key
    }, { quoted: m })
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['ping', 'p']

export default handler
