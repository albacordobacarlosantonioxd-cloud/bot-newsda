import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

/**
 * 🛠️ UPLOADER UNIVERSAL
 * Sube buffers (imágenes, videos, documentos) a la API de EvoGB.
 */
export async function uploadToEvo(buffer) {
    try {
        const { ext, mime } = await fileTypeFromBuffer(buffer)
        const form = new FormData()
        form.append('file', buffer, { filename: `file.${ext}`, contentType: mime })

        // Endpoint basado en tu captura del Uploader
        const { data } = await axios.post(`https://api.evogb.org/tools/upload?key=sasuke`, form, {
            headers: { ...form.getHeaders() }
        })

        return data.result.url // Retorna el link directo
    } catch (e) {
        console.error('Error en Uploader:', e)
        return null
    }
}
