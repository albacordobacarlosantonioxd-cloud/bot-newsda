import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const commandsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const hotReloadState = globalThis.__charlyHotReloadState ??= {}

function getCommandFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const filePath = path.join(directory, entry.name)
            if (entry.isDirectory()) return getCommandFiles(filePath)
            return entry.isFile() && filePath.endsWith('.js') ? [filePath] : []
        })
}

async function validateCommandFiles() {
    const errors = []
    const aliases = new Set()
    let loadedFiles = 0
    const token = `${Date.now()}-${Math.random()}`

    for (const filePath of getCommandFiles(commandsRoot)) {
        try {
            const moduleUrl = pathToFileURL(filePath)
            moduleUrl.searchParams.set('reload', token)
            const { default: command } = await import(moduleUrl.href)
            if (!command || !['function', 'object'].includes(typeof command)) continue
            loadedFiles++

            const commandAliases = Array.isArray(command.command)
                ? command.command
                : typeof command.command === 'string' ? [command.command] : []
            aliases.add(path.basename(filePath, '.js'))
            for (const alias of commandAliases) {
                if (typeof alias === 'string') aliases.add(alias)
            }
        } catch (error) {
            errors.push({
                file: path.relative(commandsRoot, filePath),
                message: error.message
            })
        }
    }

    return { success: errors.length === 0, loadedFiles, aliases: aliases.size, errors }
}

async function reloadCommandFiles() {
    const loader = await import('../../core/loader.js')
    if (typeof loader.reloadCommands === 'function') return loader.reloadCommands()

    hotReloadState.loader ??= (async () => {
        const loaderUrl = new URL('../../core/loader.js', import.meta.url)
        loaderUrl.searchParams.set('bootstrap', `${Date.now()}-${Math.random()}`)
        return import(loaderUrl.href)
    })()
    const hotLoader = await hotReloadState.loader
    return typeof hotLoader.reloadCommands === 'function'
        ? hotLoader.reloadCommands()
        : validateCommandFiles()
}

const handler = async (m, { isOwner }) => {
    if (!isOwner) return m.reply('Solo el propietario puede recargar los comandos.')

    try {
        const result = await reloadCommandFiles()
        if (!result.success) {
            const details = result.errors
                .slice(0, 5)
                .map(error => `${error.file}: ${error.message}`)
                .join('\n')
            const remaining = result.errors.length > 5 ? `\nY ${result.errors.length - 5} errores más.` : ''
            console.error('[RELOAD] No se aplicaron los cambios:', result.errors)
            return m.reply(`No se aplicaron los cambios; se conserva la versión anterior.\n${details}${remaining}`)
        }

        return m.reply(`✅ Comandos actualizados: ${result.loadedFiles} módulos y ${result.aliases} nombres de comando.`)
    } catch (error) {
        console.error('[RELOAD]', error)
        return m.reply('No se pudieron recargar los comandos. Revisa la consola del bot.')
    }
}

handler.help = ['reload']
handler.tags = ['main']
handler.command = ['reload', 'recargar']
handler.owner = true

export default handler
