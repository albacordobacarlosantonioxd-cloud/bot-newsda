import fs from 'fs'
import path from 'path'

/**
 * 🗄️ SISTEMA DE BASE DE DATOS - Charly-Bot Maestro V2
 * Ubicación: core/system/initdb.js
 */

const dbPath = path.join(process.cwd(), 'database.json')

const isRecord = value => value && typeof value === 'object' && !Array.isArray(value)

export function normalizeDatabase(database = {}) {
    const source = isRecord(database) ? database : {}
    const legacyData = isRecord(source.data) ? source.data : {}
    const users = isRecord(source.users) ? source.users : {}
    const legacyUsers = isRecord(legacyData.users) ? legacyData.users : {}
    const chats = isRecord(source.chats) ? source.chats : {}
    const legacyChats = isRecord(legacyData.chats) ? legacyData.chats : {}
    const stats = isRecord(source.stats) ? source.stats : {}
    const legacyStats = isRecord(legacyData.stats) ? legacyData.stats : {}
    const settings = isRecord(source.settings) ? source.settings : {}
    const legacySettings = isRecord(legacyData.settings) ? legacyData.settings : {}
    const normalized = {
        ...source,
        users: { ...users, ...legacyUsers },
        chats: { ...chats, ...legacyChats },
        stats: { totalCommands: 0, startTime: Date.now(), ...stats, ...legacyStats },
        settings: { status: true, pconly: false, gconly: false, anticall: true, ...settings, ...legacySettings }
    }

    delete normalized.data
    return normalized
}

/**
 * 📈 LÓGICA DE NIVELES Y XP
 */
export const MAX_LEVEL = 500

const xpRange = (level, multiplier = 36) => {
    if (level < 0) return { min: -1, xp: 0, max: -1 }
    let min = Math.pow(level, 2) * multiplier
    let xp = Math.pow(level + 1, 2) * multiplier - min
    let max = min + xp
    return { min, max, xp }
}

export function addExperience(user, amount = 10) {
    if (!user || typeof user !== 'object') return 0

    const storedLevel = Number(user.level)
    const storedExp = Number(user.exp)
    const reward = Number(amount)
    user.level = Math.min(MAX_LEVEL, Math.max(0, Number.isFinite(storedLevel) ? Math.floor(storedLevel) : 0))
    user.exp = Math.max(0, Number.isFinite(storedExp) ? storedExp : 0)
    user.exp = Math.min(xpRange(MAX_LEVEL).min, user.exp + (user.level < MAX_LEVEL && Number.isFinite(reward) ? Math.max(0, reward) : 0))

    while (user.level < MAX_LEVEL && user.exp >= xpRange(user.level).max) {
        user.level++
    }

    return user.level
}

const initDB = () => {
    const databaseExists = fs.existsSync(dbPath)
    let database = {}
    let needsMigration = false
    try {
        if (databaseExists) {
            database = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
            needsMigration = isRecord(database) && Object.hasOwn(database, 'data')
        }
    } catch (e) {
        console.error('⚠️ [ERROR DB] No se pudo leer la base de datos:', e)
    }

    global.db = normalizeDatabase(database)
    if (!databaseExists || needsMigration) {
        fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2))
        if (!databaseExists) console.log('📂 [SISTEMA] Base de datos inicializada.')
    }

    // Guardado automático cada 45 segundos
    const saveInterval = setInterval(() => {
        try {
            fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2))
        } catch (err) {
            console.error('⚠️ [ERROR DB] Falló el guardado automático:', err)
        }
    }, 45000)
    saveInterval.unref?.()
}

const loadDatabase = (m) => {
    try {
        if (!global.db || global.db.data || !isRecord(global.db.users) || !isRecord(global.db.chats) || !isRecord(global.db.stats) || !isRecord(global.db.settings)) {
            global.db = normalizeDatabase(global.db)
        }
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
                if (!('nsfw' in chat)) chat.nsfw = false
            } else {
                global.db.chats[m.chat] = {
                    welcome: true,
                    antiLink: false,
                    isBanned: false,
                    nsfw: false
                }
            }
        }
    } catch (e) {
        console.error('⚠️ [ERROR LOAD DB]:', e)
    }
}

export { initDB, loadDatabase, xpRange }
