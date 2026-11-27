import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import ffmpegPath from 'ffmpeg-static'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function sticker(buffer, packname = 'Charly-Bot', author = 'Carlos Alba') {
    return new Promise((resolve, reject) => {
        const tempDirectory = path.join(__dirname, '../tmp')
        const tempId = `${Date.now()}-${randomUUID()}`
        const tmpFileIn = path.join(tempDirectory, `${tempId}.tmp`)
        const tmpFileOut = path.join(tempDirectory, `${tempId}.webp`)

        const cleanup = () => {
            for (const file of [tmpFileIn, tmpFileOut]) {
                try {
                    if (fs.existsSync(file)) fs.unlinkSync(file)
                } catch {}
            }
        }

        try {
            fs.mkdirSync(tempDirectory, { recursive: true })
            fs.writeFileSync(tmpFileIn, Buffer.from(buffer))

            const ffmpeg = spawn(ffmpegPath || 'ffmpeg', [
                '-y',
                '-i', tmpFileIn,
                '-vf', 'fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-c:v', 'libwebp_anim',
                '-lossless', '1',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-t', '10',
                '-f', 'webp',
                tmpFileOut
            ])

            let stderr = ''
            let settled = false
            ffmpeg.stderr.on('data', chunk => { stderr += chunk.toString() })
            ffmpeg.on('error', error => {
                if (settled) return
                settled = true
                cleanup()
                reject(error)
            })
            ffmpeg.on('close', code => {
                if (settled) return
                settled = true
                if (code !== 0) {
                    cleanup()
                    return reject(new Error(stderr.trim() || `FFmpeg terminó con código ${code}.`))
                }
                try {
                    const result = fs.readFileSync(tmpFileOut)
                    cleanup()
                    resolve(result)
                } catch (error) {
                    cleanup()
                    reject(error)
                }
            })
        } catch (e) {
            cleanup()
            reject(e)
        }
    })
}

export { sticker }
