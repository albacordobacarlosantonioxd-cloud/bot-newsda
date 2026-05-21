var handler = async (m, { user }) => {
    let tiempoEspera = 600000 
    if (Date.now() - user.lastwork < tiempoEspera) {
        let restante = Math.ceil((tiempoEspera - (Date.now() - user.lastwork)) / 1000 / 60)
        return m.reply(`⏳ Ya chambeaste mucho, pariente. Regresa en *${restante} minutos*.`)
    }

    let ganancias = Math.floor(Math.random() * 500) + 150
    let xpGanada = Math.floor(Math.random() * 80) + 20
    
    user.money = (user.money || 0) + ganancias
    user.exp = (user.exp || 0) + xpGanada
    user.lastwork = Date.now()

    let chambas = ["Le diste mantenimiento a una Yamaha MT-09", "Programaste una nueva función para CharlyBot", "Instalaste Zorin OS en una laptop con 4GB de RAM", "Fuiste por las cocas en la MT-09", "Le explicaste a Carlos cómo usar el loader de comandos"] // ... (puedes rellenar con todas tus frases)
    
    let frase = chambas[Math.floor(Math.random() * chambas.length)]
    m.reply(`🛠️ *${frase}*\n\n💰 Ganaste: *$${ganancias}*\n✨ XP: *+${xpGanada}*`)
}
handler.command = ['work', 'trabajar', 'chamba']
export default handler
