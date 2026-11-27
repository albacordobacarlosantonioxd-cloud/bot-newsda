import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(projectRoot, '.env')

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    for (const line of envContent.split(/\r?\n/)) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
        if (!match || match[1].startsWith('#')) continue

        const [, name, rawValue] = match
        const value = rawValue.replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted)
        if (process.env[name] === undefined) process.env[name] = value
    }
}

const baseUrl = 'https://api.evogb.org'

function getApiKey() {
    const apiKey = process.env.EVO_API_KEY?.trim()
    if (!apiKey) throw new Error('Falta configurar EVO_API_KEY en el archivo .env')
    return apiKey
}

export function buildEvoUrl(endpoint, params = {}, { includeApiKey = true, apiKeyHeader = false } = {}) {
    const url = new URL(endpoint, baseUrl)

    for (const [name, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) url.searchParams.set(name, String(value))
    }

    if (includeApiKey && !apiKeyHeader) {
        url.searchParams.set('apikey', getApiKey())
    }

    return url.toString()
}

export async function evoGet(endpoint, params = {}, options = {}) {
    const { apiKeyHeader = false, responseType = 'json', timeout = 30000, ...urlOptions } = options
    const url = buildEvoUrl(endpoint, params, { ...urlOptions, apiKeyHeader })
    const headers = { Accept: 'application/json', ...options.headers }

    if (apiKeyHeader) {
        headers['x-api-key'] = getApiKey()
    }

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) })
    if (!response.ok) throw new Error(`Evo respondió con HTTP ${response.status}`)
    if (responseType === 'arrayBuffer') return Buffer.from(await response.arrayBuffer())
    return response.json()
}

export async function evoPostForm(endpoint, fields = {}, { includeApiKey = true, timeout = 30000 } = {}) {
    const form = new FormData()
    for (const [name, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) form.append(name, String(value))
    }
    if (includeApiKey) form.append('apikey', getApiKey())

    const response = await fetch(new URL(endpoint, baseUrl), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form,
        signal: AbortSignal.timeout(timeout)
    })
    if (!response.ok) throw new Error(`Evo respondió con HTTP ${response.status}`)
    return response.json()
}

export function apiSucceeded(response) {
    return response && response.status !== false && response.success !== false && !response.error
}

export function extractMediaUrl(payload) {
    const urlKeys = ['downloadUrl', 'download_url', 'download_link', 'dl', 'playUrl', 'play_url', 'play', 'videoUrl', 'video_url', 'video', 'audioUrl', 'audio_url', 'audio', 'src', 'url', 'link', 'download']
    const nestedKeys = ['result', 'data', 'resultados', 'items', 'medias', 'media', 'urls', 'download']
    const queue = [{ value: payload, downloadContext: false }]
    const visited = new Set()
    let fallbackUrl = null

    while (queue.length) {
        const { value, downloadContext } = queue.shift()
        if (typeof value === 'string') {
            if (/^https?:\/\//i.test(value)) return value
            continue
        }
        if (!value || typeof value !== 'object' || visited.has(value)) continue
        visited.add(value)

        if (Array.isArray(value)) {
            queue.push(...value.map(item => ({ value: item, downloadContext })))
            continue
        }

        if (downloadContext) {
            for (const key of ['url', 'link', 'downloadUrl', 'download_url', 'dl']) {
                const candidate = value[key]
                if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) return candidate
            }
        }

        for (const key of urlKeys.filter(key => key !== 'url' && key !== 'link')) {
            const candidate = value[key]
            if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) return candidate
        }
        for (const key of nestedKeys) {
            if (value[key] && typeof value[key] === 'object') {
                const entry = { value: value[key], downloadContext: key === 'download' }
                if (key === 'download') queue.unshift(entry)
                else queue.push(entry)
            }
        }
        for (const key of ['url', 'link']) {
            const candidate = value[key]
            if (!fallbackUrl && typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
                fallbackUrl = candidate
            }
        }
    }

    return fallbackUrl
}

export function extractMediaUrls(payload) {
    const list = payload?.result ?? payload?.data ?? payload?.resultados ?? payload?.items ?? []
    const values = Array.isArray(list) ? list : [list]
    return values.map(extractMediaUrl).filter(Boolean)
}

export function extractMediaItem(payload) {
    const candidates = [payload?.result, payload?.data, payload?.resultados, payload]
    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length) return candidate[0]
        if (candidate && typeof candidate === 'object') return candidate
    }
    return {}
}