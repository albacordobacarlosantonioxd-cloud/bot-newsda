import fs from 'fs'
import path from 'path'

/**
 * 🗄️ SISTEMA DE BASE DE DATOS - Charly-Bot Maestro V2
 * Ubicación: core/system/initdb.js
 */

const dbPath = path.join(process.cwd(), 'database.json')

/**
 * 📈 LÓGICA DE NIVELES Y XP
 */
const xpRange = (level, multiplier = 36) => {
    if (level < 0) return { min: -1, xp: 0, max: -1 }
    let min = Math.pow(level, 2) * multiplier
    let xp = Math.pow(level + 1, 2) * multiplier - min
    let max = min + xp
    return { min, max, xp }
}

const initDB = () => {
    if (!fs.existsSync(dbPath)) {
        const initialStructure = {
            users: {},
            chats: {},
            stats: {
                totalCommands: 0,
                startTime: Date.now()
            },
            settings: {
                status: true,
                pconly: false,
                gconly: false,
                anticall: true
            }
        }
        fs.writeFileSync(dbPath, JSON.stringify(initialStructure, null, 2))
        console.log('📂 [SISTEMA] Base de datos inicializada.')
    }

    try {
        global.db = JSON.parse(fs.readFileSync(dbPath))
    } catch (e) {
        console.error('⚠️ [ERROR DB] No se pudo leer la base de datos:', e)
        global.db = { users: {}, chats: {}, stats: {}, settings: {} }
    }

    // Guardado automático cada 45 segundos
    setInterval(() => {
        try {
            fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2))
        } catch (err) {
            console.error('⚠️ [ERROR DB] Falló el guardado automático:', err)
        }
    }, 45000)
}

const loadDatabase = (m) => {
    try {
        const isNumber = x => typeof x === 'number' && !isNaN(x)
        let user = global.db.users[m.sender]
        
        if (typeof user !== 'object') global.db.users[m.sender] = {}
        if (user) {
            // --- CAMPOS RPG ---
            if (!isNumber(user.exp)) user.exp = 0
            if (!isNumber(user.level)) user.level = 0
            if (!isNumber(user.limit)) user.limit = 15
            if (!isNumber(user.money)) user.money = 0
            if (!isNumber(user.lastwork)) user.lastwork = 0 // Tiempo del comando work
            if (!isNumber(user.comandos)) user.comandos = 0

            // --- SISTEMA AFK ---
            if (!isNumber(user.afk)) user.afk = -1
            if (!('afkReason' in user)) user.afkReason = ''

            // --- PERFIL SOCIAL ---
            if (!('registered' in user)) user.registered = false
            if (!('birth' in user)) user.birth = 'No definido'
            if (!('pasatiempo' in user)) user.pasatiempo = 'No definido'
            if (!('genero' in user)) user.genero = 'No definido'
            if (!('description' in user)) user.description = 'Sin descripción'
            
            // --- MATRIMONIO ---
            if (!('marry' in user)) user.marry = '' // JID de la pareja
            if (!('pareja' in user)) user.pareja = 'Nadie'
            if (!('estadoCivil' in user)) user.estadoCivil = 'Soltero(a)'

            // --- SEGURIDAD ---
            if (!isNumber(user.warn)) user.warn = 0
            if (!('premium' in user)) user.premium = false
            if (!('banned' in user)) user.banned = false
            if (!('role' in user)) user.role = 'Novato'
            if (!('name' in user)) user.name = m.pushName || 'Usuario'
            
        } else {
            // REGISTRO INICIAL COMPLETO
            global.db.users[m.sender] = {
                exp: 0,
                level: 0,
                limit: 15,
                money: 0,
                lastwork: 0,
                comandos: 0,
                afk: -1,
                afkReason: '',
                registered: false,
                birth: 'No definido',
                pasatiempo: 'No definido',
                genero: 'No definido',
                description: 'Sin descripción',
                marry: '',
                pareja: 'Nadie',
                estadoCivil: 'Soltero(a)',
                warn: 0,
                premium: false,
                banned: false,
                role: 'Novato',
                name: m.pushName || 'Usuario'
            }
        }

        // --- REGISTRO DE CHAT (GRUPOS) ---
        if (m.isGroup) {
            let chat = global.db.chats[m.chat]
            if (typeof chat !== 'object') global.db.chats[m.chat] = {}
            if (chat) {
                if (!('welcome' in chat)) chat.welcome = true
                if (!('antiLink' in chat)) chat.antiLink = false
                if (!('isBanned' in chat)) chat.isBanned = false
            } else {
                global.db.chats[m.chat] = {
                    welcome: true,
                    antiLink: false,
                    isBanned: false
                }
            }
        }
    } catch (e) {
        console.error('⚠️ [ERROR LOAD DB]:', e)
    }
}

export { initDB, loadDatabase, xpRange }
