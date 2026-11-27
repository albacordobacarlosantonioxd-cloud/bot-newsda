function detectFileType(buffer) {
    const data = Buffer.from(buffer)
    if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' }
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' }
    if (data.toString('ascii', 0, 3) === 'GIF') return { ext: 'gif', mime: 'image/gif' }
    if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' }
    if (data.toString('ascii', 0, 4) === '%PDF') return { ext: 'pdf', mime: 'application/pdf' }
    if (data.toString('ascii', 4, 8) === 'ftyp') return { ext: 'mp4', mime: 'video/mp4' }
    if (data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return { ext: 'webm', mime: 'video/webm' }
    if (data.toString('ascii', 0, 3) === 'ID3' || (data[0] === 0xff && (data[1] & 0xe0) === 0xe0)) return { ext: 'mp3', mime: 'audio/mpeg' }
    if (data.toString('ascii', 0, 4) === 'OggS') return { ext: 'ogg', mime: 'audio/ogg' }
    if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WAVE') return { ext: 'wav', mime: 'audio/wav' }
    return { ext: 'bin', mime: 'application/octet-stream' }
}

/**
 * Sube buffers de imágenes, videos y documentos a EvoGB.
 */
export async function uploadToEvo(buffer) {
    try {
        const { ext, mime } = detectFileType(buffer)
        const form = new FormData()
        form.append('file', new Blob([buffer], { type: mime }), `file.${ext}`)

        const response = await fetch('https://api.evogb.org/tools/upload', { method: 'POST', body: form })
        if (!response.ok) throw new Error(`Evo respondió con HTTP ${response.status}`)
        const data = await response.json()

        return data?.result?.url || data?.url || null
    } catch (e) {
        console.error('Error en Uploader:', e)
        return null
    }
}
