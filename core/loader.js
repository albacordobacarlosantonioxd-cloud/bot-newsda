import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const commandsRoot = path.resolve(process.cwd(), 'cmds')
let commandRegistry = null
let registryLoadPromise = null
let reloadSequence = 0
let autoReloadTimer = null
const commandWatchers = new Map()

function getFiles(directory) {
    if (!fs.existsSync(directory)) return []

    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const filePath = path.join(directory, entry.name)
            if (entry.isDirectory()) return getFiles(filePath)
            return entry.isFile() && filePath.endsWith('.js') ? [filePath] : []
        })
}

function getDirectories(directory) {
    if (!fs.existsSync(directory)) return []

    return [
        directory,
        ...fs.readdirSync(directory, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .flatMap(entry => getDirectories(path.join(directory, entry.name)))
    ]
}

function watchCommandDirectories() {
    const directories = new Set(getDirectories(commandsRoot))
    for (const [directory, watcher] of commandWatchers) {
        if (directories.has(directory)) continue
        watcher.close()
        commandWatchers.delete(directory)
    }

    for (const directory of directories) {
        if (commandWatchers.has(directory)) continue
        try {
            const watcher = fs.watch(directory, { persistent: false }, () => scheduleCommandReload())
            watcher.on('error', error => {
                console.error(`[COMMAND WATCHER] ${directory}: ${error.message}`)
                watcher.close()
                commandWatchers.delete(directory)
            })
            watcher.unref()
            commandWatchers.set(directory, watcher)
        } catch (error) {
            console.error(`[COMMAND WATCHER] No se pudo vigilar ${directory}: ${error.message}`)
        }
    }
}

function scheduleCommandReload() {
    if (autoReloadTimer) clearTimeout(autoReloadTimer)
    autoReloadTimer = setTimeout(async () => {
        autoReloadTimer = null
        try {
            const result = await reloadCommands()
            if (result.success) {
                console.log(`[COMMAND WATCHER] Actualizados ${result.loadedFiles} módulos y ${result.aliases} nombres de comando.`)
            } else {
                console.error('[COMMAND WATCHER] Se mantienen los comandos activos; fallaron:', result.errors)
            }
        } catch (error) {
            console.error('[COMMAND WATCHER] No se pudieron actualizar los comandos:', error)
        }
        watchCommandDirectories()
    }, 400)
    autoReloadTimer.unref?.()
}

async function buildCommandRegistry({ cacheBust = false } = {}) {
    const registry = new Map()
    const errors = []
    let loadedFiles = 0
    const updateToken = cacheBust ? `${Date.now()}-${++reloadSequence}` : ''

    for (const filePath of getFiles(commandsRoot)) {
        try {
            const moduleUrl = pathToFileURL(filePath)
            if (cacheBust) moduleUrl.searchParams.set('update', updateToken)
            const { default: command } = await import(moduleUrl.href)
            if (!command || !['function', 'object'].includes(typeof command)) continue

            loadedFiles++
            const fileName = path.basename(filePath, '.js')
            const aliases = Array.isArray(command.command)
                ? command.command
                : typeof command.command === 'string' ? [command.command] : []

            for (const name of [fileName, ...aliases]) {
                if (typeof name === 'string' && !registry.has(name)) registry.set(name, command)
            }
        } catch (error) {
            errors.push({
                file: path.relative(commandsRoot, filePath),
                message: error.message
            })
        }
    }

    return { registry, errors, loadedFiles }
}

async function getCommandRegistry() {
    if (commandRegistry) return commandRegistry
    if (!registryLoadPromise) {
        registryLoadPromise = buildCommandRegistry().then(result => {
            commandRegistry = result.registry
            for (const error of result.errors) {
                console.error(`[COMMAND LOADER] ${error.file}: ${error.message}`)
            }
            watchCommandDirectories()
            return commandRegistry
        }).finally(() => {
            registryLoadPromise = null
        })
    }
    return registryLoadPromise
}

export async function getCommand(commandName) {
    const registry = await getCommandRegistry()
    return registry.get(commandName) || null
}

export async function reloadCommands() {
    const result = await buildCommandRegistry({ cacheBust: true })
    if (result.errors.length) return { success: false, loadedFiles: 0, aliases: 0, errors: result.errors }

    commandRegistry = result.registry
    watchCommandDirectories()
    return {
        success: true,
        loadedFiles: result.loadedFiles,
        aliases: result.registry.size,
        errors: []
    }
}
