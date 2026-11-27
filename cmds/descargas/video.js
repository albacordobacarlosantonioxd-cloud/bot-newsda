import { randomBytes } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { apiSucceeded, evoGet, extractMediaItem, extractMediaUrl } from '../../core/evogb.js'
import { extractFirstSearchResult, extractYouTubeUrl, formatMediaDetails, getMediaDurationSeconds, normalizeYouTubeUrl, safeMediaFilename } from '../../core/downloaders.js'

const VIDEO_QUALITY = '480'
const execFileAsync = promisify(execFile)

async function getVideoThumbnail(videoBuffer) {
    const fileId = randomBytes(8).toString('hex')
    const videoPath = path.join(os.tmpdir(), `charly_video_${fileId}.mp4`)
    const thumbnailPath = path.join(os.tmpdir(), `charly_video_${fileId}.jpg`)

    try {
        await fs.writeFile(videoPath, videoBuffer)
        await execFileAsync(ffmpegPath || 'ffmpeg', [
            '-hide_banner', '-loglevel', 'error', '-y', '-i', videoPath,
            '-frames:v', '1', '-vf', 'scale=320:-2', thumbnailPath
        ], { timeout: 30000 })
        return await fs.readFile(thumbnailPath)
    } catch {
        return undefined
    } finally {
        await fs.rm(videoPath, { force: true }).catch(() => {})
        await fs.rm(thumbnailPath, { force: true }).catch(() => {})
    }
}

async function convertToMobileMp4(videoBuffer) {
    const fileId = randomBytes(8).toString('hex')
    const inputPath = path.join(os.tmpdir(), `charly_video_${fileId}.input`)
    const outputPath = path.join(os.tmpdir(), `charly_video_${fileId}.mp4`)

    try {
        await fs.writeFile(inputPath, videoBuffer)
        await execFileAsync(ffmpegPath || 'ffmpeg', [
            '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
            '-map', '0:v:0', '-map', '0:a:0?',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:v', 'libx264', '-profile:v', 'baseline', '-preset', 'veryfast',
            '-crf', '23', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
            '-movflags', '+faststart', outputPath
        ], { timeout: 180000 })
        return await fs.readFile(outputPath)
    } finally {
        await fs.rm(inputPath, { force: true }).catch(() => {})
        await fs.rm(outputPath, { force: true }).catch(() => {})
    }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = String(text || m.quoted?.text || '').trim()
    if (!query) return m.reply(`Escribe una búsqueda o un enlace de YouTube.\nEjemplo: ${usedPrefix + command} Que Loke`)

    try {
        let youtubeUrl = normalizeYouTubeUrl(query)
        let searchItem = null
        if (!youtubeUrl) {
            youtubeUrl = query
            const searchData = await evoGet('/search/yt', { query })
            if (!apiSucceeded(searchData)) return m.reply('No se encontraron resultados de YouTube.')
            searchItem = extractFirstSearchResult(searchData)
            youtubeUrl = extractYouTubeUrl(searchItem)
            if (!youtubeUrl) return m.reply('El primer resultado no incluyó un enlace válido de YouTube.')
        }

        const data = await evoGet('/dl/ytmp4', { url: youtubeUrl, quality: VIDEO_QUALITY })
        if (!apiSucceeded(data)) return m.reply('Evo no pudo descargar el video de YouTube.')

        const video = extractMediaItem(data)
        const videoUrl = extractMediaUrl(data)
        if (!videoUrl) return m.reply('La API no devolvió un enlace de video.')

        const videoResponse = await fetch(videoUrl, { signal: AbortSignal.timeout(120000) })
        if (!videoResponse.ok) throw new Error(`El archivo de video respondió con HTTP ${videoResponse.status}`)

        const contentType = videoResponse.headers.get('content-type')?.toLowerCase() || ''
        if (contentType.includes('text/html') || contentType.includes('application/json')) {
            throw new Error('El enlace de descarga no devolvió un archivo de video')
        }

        const sourceVideoBuffer = Buffer.from(await videoResponse.arrayBuffer())
        if (!sourceVideoBuffer.length) throw new Error('El archivo de video está vacío')

        const videoBuffer = await convertToMobileMp4(sourceVideoBuffer)
        const jpegThumbnail = await getVideoThumbnail(videoBuffer)
        const details = { ...(searchItem || {}), ...video }
        const title = safeMediaFilename(details.title || details.name, 'youtube-video')
        await conn.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`,
            caption: formatMediaDetails(details, 'YouTube MP4'),
            ...(jpegThumbnail ? { jpegThumbnail } : {}),
            ...(getMediaDurationSeconds(details) ? { seconds: getMediaDurationSeconds(details) } : {})
        }, { quoted: m })
    } catch (error) {
        console.error('[YTMP4]', error.message)
        return m.reply('No se pudo completar la descarga del video de YouTube.')
    }
}

handler.help = ['video <búsqueda o URL>', 'ytmp4 <búsqueda o URL>', 'ytvideo <búsqueda o URL>']
handler.tags = ['descargas']
handler.command = ['video', 'ytmp4', 'ytvideo']

export default handler