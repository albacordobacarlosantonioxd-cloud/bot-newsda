import fs from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'

export async function createQr(qr, imagePath) {
    const terminalQr = await QRCode.toString(qr, { type: 'terminal', small: true })
    await fs.mkdir(path.dirname(imagePath), { recursive: true })
    await QRCode.toFile(imagePath, qr, { errorCorrectionLevel: 'H', margin: 2, scale: 8 })
    return terminalQr
}