import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 🛠️ CORE DE STICKERS - Charly Developer
 * Convierte imágenes/videos a formato WebP compatible con WhatsApp.
 */

async function sticker(buffer, packname = 'Charly-Bot', author = 'Carlos Alba') {
    return new Promise(async (resolve, reject) => {
        try {
            const tmpFileIn = path.join(__dirname, `../tmp/${Date.now()}.tmp`)
            const tmpFileOut = path.join(__dirname, `../tmp/${Date.now()}.webp`)

            if (!fs.existsSync(path.join(__dirname, '../tmp'))) fs.mkdirSync(path.join(__dirname, '../tmp'))
            fs.writeFileSync(tmpFileIn, buffer)

            // Usamos FFmpeg para convertir a WebP con los parámetros exactos de WhatsApp
            // Esto arregla que el BratV se quede en blanco
            const ffmpeg = spawn('ffmpeg', [
                '-i', tmpFileIn,
                '-vcodec', 'libwebp',
                '-filter_params', 'fps=fps=15',
                '-lossless', '1',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-s', '512:512',
                '-f', 'webp',
                tmpFileOut
            ])

            ffmpeg.on('close', async (code) => {
                if (code !== 0) {
                    if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn)
                    return reject('Error en FFmpeg')
                }
                const result = fs.readFileSync(tmpFileOut)
                if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn)
                if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut)
                resolve(result)
            })

            ffmpeg.on('error', (err) => {
                reject(err)
            })
        } catch (e) {
            reject(e)
        }
    })
}

export { sticker }
