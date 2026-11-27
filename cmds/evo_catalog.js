import { apiSucceeded, evoGet, evoPostForm, extractMediaItem, extractMediaUrl } from '../core/evogb.js'
import { getMediaDurationSeconds } from '../core/downloaders.js'
import { uploadToEvo } from '../core/uploader.js'
import { stripEmojis } from '../core/text.js'

const get = (command, path, args = [], options = {}) => ({
    command,
    path,
    method: 'GET',
    args,
    required: options.required ?? args,
    defaults: options.defaults || {},
    includeApiKey: options.includeApiKey ?? true,
    output: options.output || 'text',
    category: options.category || 'Otros',
    title: options.title || command,
    mediaField: options.mediaField,
    nsfw: options.nsfw || false,
    existing: options.existing,
    blocked: options.blocked || false
})

const post = (command, path, args = [], options = {}) => ({
    ...get(command, path, args, options),
    method: 'POST'
})

const endpoints = [
    get('ytmp3', '/dl/ytmp3', ['url'], { output: 'audio', category: 'Descargas', title: 'YouTube MP3', existing: 'ytmp3' }),
    get('instagram', '/dl/instagram', ['url'], { output: 'media', category: 'Descargas', existing: 'ig' }),
    get('facebookv2', '/dl/facebookv2', ['url'], { output: 'media', category: 'Descargas', existing: 'fb' }),
    get('spotify', '/dl/spotify', ['url'], { output: 'audio', category: 'Descargas', existing: 'spotify' }),
    get('soundcloud', '/dl/soundcloud', ['url'], { output: 'audio', category: 'Descargas', existing: 'sc' }),
    get('dropbox', '/dl/dropbox', ['url'], { output: 'document', category: 'Descargas', existing: 'dropbox' }),
    get('pinterest', '/dl/pinterest', ['url'], { output: 'media', category: 'Descargas', existing: 'pinterest' }),
    get('twitter', '/dl/twitter', ['url'], { output: 'media', category: 'Descargas', existing: 'twitter' }),
    get('tiktok', '/dl/tiktok', ['url'], { output: 'video', category: 'Descargas', existing: 'tiktok' }),
    get('drive', '/dl/google-drive', ['url'], { output: 'document', category: 'Descargas', existing: 'drive' }),
    get('ytmp4', '/dl/ytmp4', ['url', 'quality'], { required: ['url'], defaults: { quality: '480' }, output: 'video', category: 'Descargas', title: 'YouTube MP4', existing: 'ytmp4' }),
    get('mediafire', '/dl/mediafire', ['url'], { includeApiKey: false, output: 'document', category: 'Descargas', existing: 'mf' }),
    get('facebookv1', '/dl/facebook', ['url'], { output: 'media', category: 'Descargas', existing: 'facebookv1' }),
    get('tiktokmp3', '/dl/tiktokmp3', ['url'], { output: 'audio', category: 'Descargas', existing: 'tiktokmp3' }),
    get('tiktokv2', '/dl/tiktokv2', ['url'], { output: 'video', category: 'Descargas', existing: 'tiktokv2' }),
    get('threads', '/dl/threads', ['url'], { output: 'media', category: 'Descargas', existing: 'threads' }),
    get('youtubeplay', '/dl/youtubeplay', ['query', 'type', 'quality'], { required: ['query', 'type'], defaults: { quality: '480' }, output: 'media', category: 'Descargas' }),
    get('terabox', '/dl/terabox', ['url'], { output: 'document', category: 'Descargas', existing: 'terabox' }),
    get('deezer', '/dl/deezer', ['url'], { includeApiKey: false, output: 'audio', category: 'Descargas', existing: 'deezer' }),

    get('country', '/tools/country', ['name', 'mode'], { includeApiKey: false, category: 'Herramientas', title: 'Información de país' }),
    get('wacheck', '/tools/whatsapp/check-number', ['number', 'lang'], { required: ['number'], defaults: { lang: 'es' }, includeApiKey: false, category: 'Herramientas', title: 'Verificar número de WhatsApp' }),
    get('tempmailread', '/tools/tempmail-read', ['email'], { category: 'Herramientas', existing: 'readmail' }),
    get('hostinfo', '/tools/hostinfo', ['domain'], { category: 'Herramientas', title: 'Información de dominio' }),
    get('ssweb', '/tools/ssweb', ['url', 'device'], { category: 'Herramientas', existing: 'ssweb', output: 'image' }),
    get('npmsearch', '/tools/npmjs', ['query', 'type'], { category: 'Herramientas', includeApiKey: false }),
    get('lyrics', '/tools/lyrics', ['query', 'server'], { category: 'Herramientas', title: 'Buscar letras' }),
    post('shazam', '/tools/whatmusic-shazam', ['url'], { required: ['url'], defaults: { method: 'url' }, mediaField: 'url', includeApiKey: false, category: 'Herramientas', title: 'Identificar audio' }),
    get('shortlink', '/tools/shortlink', ['url', 'alias'], { required: ['url'], includeApiKey: false, category: 'Herramientas', existing: 'acortador' }),
    get('clima', '/tools/clima', ['city', 'version', 'fields'], { required: ['city', 'version'], defaults: { version: 'auto' }, includeApiKey: false, category: 'Herramientas', existing: 'clima' }),
    post('removebg', '/tools/removebg', ['url'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Herramientas', existing: 'rbg', output: 'image' }),
    post('evoUpscale', '/tools/upscale', ['url'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Herramientas', existing: 'upscaler', output: 'image' }),
    get('emojimix', '/tools/emojimix', ['emoji1', 'emoji2'], { includeApiKey: false, category: 'Herramientas', output: 'image' }),
    post('removevocals', '/tools/remove-vocals', ['url'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Herramientas', output: 'audio' }),
    get('minecraft', '/tools/minecraft', ['host', 'edition'], { category: 'Herramientas' }),
    post('evoupload', '/tools/upload', ['url', 'server', 'author'], { required: ['url'], defaults: { method: 'url', server: 'evogb', author: 'Charly Bot' }, mediaField: 'url', includeApiKey: false, category: 'Herramientas', title: 'Subir archivo', output: 'text' }),
    post('ocr', '/tools/ocr', ['url', 'model'], { required: ['url'], defaults: { method: 'url', model: 'ocr-normal' }, mediaField: 'url', includeApiKey: false, category: 'Herramientas', title: 'Leer texto de imagen' }),
    get('bratimage', '/tools/brat', ['text', 'animated'], { required: ['text', 'animated'], defaults: { animated: 'false' }, includeApiKey: false, category: 'Herramientas', output: 'image' }),
    get('translate', '/tools/translate', ['text', 'to'], { required: ['text'], includeApiKey: false, category: 'Herramientas', existing: 'translate' }),
    post('compressimage', '/tools/compress-image', ['url', 'level'], { required: ['url'], defaults: { method: 'url', level: 'recommended' }, mediaField: 'url', category: 'Herramientas', existing: 'compressimagen', output: 'image' }),
    post('compresspdf', '/tools/compress-pdf', ['url', 'level'], { required: ['url'], defaults: { method: 'url', level: 'recommended' }, mediaField: 'url', category: 'Herramientas', existing: 'compresspdf', output: 'document' }),
    get('tempmail', '/tools/tempmail', [], { category: 'Herramientas', existing: 'tempmail' }),
    post('bodydetect', '/tools/human-body-detection', ['url', 'model', 'evidence'], { required: ['url'], defaults: { model: 'auto', evidence: 'false', method: 'url' }, mediaField: 'url', category: 'Herramientas', nsfw: true, title: 'Análisis sensible de imagen' }),
    get('wainspect', '/tools/whatsapp/inspect', ['link', 'type'], { required: ['link'], includeApiKey: false, category: 'Herramientas', title: 'Inspeccionar enlace de WhatsApp' }),

    post('quotebasic', '/generate/quote-basic', ['name', 'textMarkdown', 'solidColor'], { includeApiKey: false, category: 'Generadores', title: 'Crear cita básica', output: 'image' }),
    post('quoteimage', '/generate/quote-image', ['url', 'name', 'textMarkdown'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Generadores', output: 'image' }),
    post('filters', '/generate/filters', ['url', 'filterType'], { defaults: { method: 'url' }, mediaField: 'url', includeApiKey: false, category: 'Generadores', output: 'image' }),
    post('animatedgif', '/generate/animated-gif', ['url', 'gifType'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Generadores', output: 'video' }),
    post('levelcard', '/generate/level-card', ['url', 'username', 'userLevel', 'currxp', 'needxp'], { required: ['url'], defaults: { method: 'url' }, mediaField: 'url', category: 'Generadores', output: 'image' }),
    get('levelupimage', '/generate/levelup', ['avatar'], { required: [], category: 'Generadores', output: 'image' }),
    get('rankcard', '/generate/rank', ['username', 'avatar', 'needxp', 'currxp', 'level'], { required: [], includeApiKey: false, category: 'Generadores', output: 'image' }),
    get('byeimage', '/generate/bye-image', ['username', 'guildName', 'avatar'], { required: [], category: 'Generadores', output: 'image' }),
    get('welcome2', '/generate/welcome2', ['username', 'guildName', 'avatar', 'memberCount'], { required: [], category: 'Generadores', output: 'image' }),
    post('welcomecard', '/generate/welcome-card', ['method', 'username', 'servername'], { required: ['method'], category: 'Generadores', output: 'image' }),
    post('pridefilter', '/generate/gay', ['url', 'mode', 'resize'], { defaults: { method: 'url' }, mediaField: 'url', includeApiKey: false, category: 'Generadores', output: 'image' }),
    get('hornyimage', '/generate/horny', ['avatar'], { required: [], includeApiKey: false, category: 'Generadores', output: 'image' }),
    get('welcomeimage', '/generate/welcome-image', ['username', 'guildName', 'avatar'], { required: [], category: 'Generadores', output: 'image' }),
    post('quoteadvanced', '/generate/quote', ['url', 'name', 'textMarkdown'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Generadores', output: 'image' }),
    post('quotestories', '/generate/quote-stories', ['url', 'name', 'textMarkdown'], { defaults: { method: 'url' }, mediaField: 'url', category: 'Generadores', output: 'image' }),

    get('igstalk', '/stalking/instagram', ['username'], { category: 'Perfiles', existing: 'igstalk' }),
    get('ttstalk', '/stalking/tiktok', ['username'], { category: 'Perfiles', existing: 'ttstalk' }),
    get('robloxstalk', '/stalking/roblox', ['username'], { includeApiKey: false, category: 'Perfiles' }),
    get('telegramstalk', '/stalking/telegram', ['channel'], { category: 'Perfiles' }),
    get('githubstalk', '/stalking/github', ['username'], { category: 'Perfiles', existing: 'githubstalk' }),

    get('aifree', '/ai/free', ['text', 'role', 'model', 'json'], { includeApiKey: false, category: 'IA' }),
    get('evogpt', '/ai/chatgpt', ['text'], { category: 'IA', title: 'ChatGPT Evo' }),
    get('gptprompt', '/ai/gptprompt', ['text', 'prompt'], { category: 'IA' }),
    get('copilot', '/ai/copilot', ['text'], { includeApiKey: false, category: 'IA' }),
    get('gemini', '/ai/gemini', ['text', 'prompt'], { category: 'IA' }),
    get('gptsession', '/ai/gpt4-session', ['text', 'session'], { category: 'IA' }),
    post('imageprompt', '/ai/image-to-prompt', ['url', 'lang'], { required: ['url'], defaults: { method: 'url', lang: 'es' }, mediaField: 'url', category: 'IA' }),
    get('qwen', '/ai/qwen', ['text'], { category: 'IA' }),
    post('nanoedit', '/ai/nanobanana', ['url', 'prompt'], { defaults: { method: 'url' }, mediaField: 'url', category: 'IA', output: 'image', title: 'Editar imagen con IA' }),
    get('claude', '/ai/claude', ['text'], { category: 'IA', existing: 'claude' }),
    post('toreal', '/ai/toreal', ['url'], { defaults: { method: 'url' }, mediaField: 'url', category: 'IA', output: 'image' }),

    get('nsfwinteraction', '/nsfw/interaction', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true }),
    get('rule34', '/nsfw/rule34', ['tag', 'type'], { category: 'Adulto', nsfw: true }),
    get('xvideosdl', '/nsfw/dl/xvideos', ['url'], { category: 'Adulto', nsfw: true, output: 'video' }),
    get('xnxxdl', '/nsfw/dl/xnxx', ['url'], { category: 'Adulto', nsfw: true, output: 'video' }),
    get('trapito', '/nsfw/random/trapito', ['type'], { category: 'Adulto', nsfw: true, output: 'media' }),
    get('gayimage', '/porn/image/gay', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'image' }),
    get('gayvideo', '/porn/video/gay', [], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'video' }),
    get('hentai', '/nsfw/random/hentai', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'media' }),
    get('furro', '/nsfw/random/furro', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'media' }),
    get('yuri', '/nsfw/random/yuri', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'media' }),
    get('safebooru', '/nsfw/safebooru', ['keyword'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'image' }),
    get('xnxxsearch', '/nsfw/search/xnxx', ['query'], { category: 'Adulto', nsfw: true }),
    get('yuri2', '/nsfw/random/yuri2', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'media' }),
    get('nsfwloli', '/nsfw/random/loli', ['type'], { includeApiKey: false, category: 'Adulto', nsfw: true, blocked: true }),
    get('gelbooru', '/nsfw/gelbooru', ['json'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'image' }),
    get('straightimage', '/porn/image/straight', ['type'], { category: 'Adulto', nsfw: true, output: 'image' }),
    get('pornhubsearch', '/nsfw/search/pornhub', ['query'], { category: 'Adulto', nsfw: true }),
    post('nsfwdetect', '/nsfw/detect', ['url', 'model', 'frames'], { required: ['url'], defaults: { method: 'url', model: 'auto', frames: '8' }, mediaField: 'url', category: 'Adulto', nsfw: true }),
    post('nsfwdetectfree', '/nsfw/detect-free', ['url'], { required: ['url'], defaults: { method: 'url' }, mediaField: 'url', includeApiKey: false, category: 'Adulto', nsfw: true }),
    get('straightvideo', '/porn/video/straight', [], { category: 'Adulto', nsfw: true, output: 'video' }),
    get('hentaivideo', '/nsfw/video/hentai', [], { category: 'Adulto', nsfw: true, output: 'video' }),
    get('yaoivideo', '/nsfw/video/yaoi', [], { category: 'Adulto', nsfw: true, output: 'video' }),
    get('transvideo', '/nsfw/video/trans', [], { category: 'Adulto', nsfw: true, output: 'video' }),
    get('nsfwrandom', '/nsfw/rnd', ['type'], { category: 'Adulto', nsfw: true, output: 'media' }),
    post('nsfwdetectv4', '/nsfw/detect/v4', ['url', 'checks'], { required: ['url', 'checks'], defaults: { method: 'url' }, mediaField: 'url', category: 'Adulto', nsfw: true }),
    get('femboy', '/nsfw/random/femboy', [], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'media' }),
    get('danbooru', '/nsfw/danbooru', ['keyword'], { includeApiKey: false, category: 'Adulto', nsfw: true, output: 'image' }),
    get('xvideossearch', '/nsfw/search/xvideos', ['query'], { includeApiKey: false, category: 'Adulto', nsfw: true }),

    get('sfwrandom', '/sfw/rnd', ['type'], { includeApiKey: false, category: 'SFW', output: 'media' }),
    get('sfwrandomv2', '/sfw/rnd/v2', ['type'], { includeApiKey: false, category: 'SFW', output: 'media' }),
    get('sfwloli', '/sfw/loli', [], { includeApiKey: false, category: 'SFW', output: 'image' }),
    get('sfwneko', '/sfw/neko', [], { category: 'SFW', output: 'image' }),
    get('sfwbluearchive', '/sfw/bluearchive', [], { category: 'SFW', output: 'image' }),
    get('sfwboys', '/sfw/boys', ['type'], { includeApiKey: false, category: 'SFW', output: 'media' }),
    get('sfwgays', '/sfw/gays', ['type'], { includeApiKey: false, category: 'SFW', output: 'media' }),
    get('sfwgirls', '/sfw/girls', ['type'], { includeApiKey: false, category: 'SFW', output: 'media' }),

    get('yts', '/search/yt', ['query'], { category: 'Búsquedas', existing: 'yts' }),
    get('soundcloudsearch', '/search/soundcloud', ['query'], { category: 'Búsquedas' }),
    get('googleimage', '/search/googleimage', ['query'], { includeApiKey: false, category: 'Búsquedas', existing: 'googleimage', output: 'image' }),
    get('bingimage', '/search/bingimage', ['query'], { includeApiKey: false, category: 'Búsquedas', output: 'image' }),
    get('wikipedia', '/search/wikipedia', ['query', 'lang'], { required: ['query'], defaults: { lang: 'es' }, includeApiKey: false, category: 'Búsquedas' }),
    get('pinterestvideo', '/search/pinterestvideo', ['query'], { category: 'Búsquedas' }),
    get('apksearch', '/search/apk', ['query'], { category: 'Búsquedas' }),
    get('spotifysearch', '/search/spotify', ['query'], { category: 'Búsquedas', existing: 'spotify' }),
    get('pinterestsearch', '/search/pinterest', ['query'], { category: 'Búsquedas', existing: 'pinterest' }),
    get('pinterestv3', '/search/pinterestv3', ['query'], { category: 'Búsquedas' }),
    get('tiktoksearch', '/search/tiktok', ['query'], { category: 'Búsquedas' }),
    get('pinterestv2', '/search/pinterestv2', ['query'], { includeApiKey: false, category: 'Búsquedas', existing: 'pinterest' }),
    get('deezersearch', '/search/deezer', ['query', 'limit'], { required: ['query'], defaults: { limit: '10' }, includeApiKey: false, category: 'Búsquedas' }),
    get('tenorsearch', '/search/tenor', ['query', 'provider'], { category: 'Búsquedas' }),

    post('imgconvert', '/api/converter-img', ['url', 'to', 'width', 'height'], { required: ['url', 'to', 'width', 'height'], defaults: { method: 'url' }, mediaField: 'url', includeApiKey: false, category: 'Convertidores', output: 'image' }),
    post('imgtopdf', '/api/converter-img-to-pdf', ['url', 'orientation', 'pagesize', 'margin'], { required: ['url'], defaults: { method: 'url', orientation: 'portrait', pagesize: 'A4', margin: '10' }, mediaField: 'url', category: 'Convertidores', output: 'document' }),
    post('pdftoimg', '/api/converter-pdf-to-img', ['url', 'mode'], { required: ['url', 'mode'], defaults: { method: 'url' }, mediaField: 'url', category: 'Convertidores', output: 'image' })
]

const commands = endpoints.filter(item => !item.existing && !item.blocked)
const endpointByCommand = new Map(commands.map(item => [item.command, item]))
const categories = [...new Set(endpoints.map(item => item.category))]

function parseInput(endpoint, text, hasAttachment) {
    const input = (text || '').trim()
    if (!endpoint.args.length) return {}

    if (input.startsWith('{')) {
        try {
            const value = JSON.parse(input)
            if (value && typeof value === 'object' && !Array.isArray(value)) return value
        } catch {
            return null
        }
        return null
    }

    const firstValue = input.split('|')[0].trim()
    const inputFields = hasAttachment && endpoint.mediaField && !/^https?:\/\//i.test(firstValue)
        ? endpoint.args.filter(field => field !== endpoint.mediaField)
        : endpoint.args
    const parts = input.includes('|')
        ? input.split('|').map(value => value.trim())
        : [input]
    const values = {}
    inputFields.forEach((name, index) => {
        if (parts[index]) values[name] = parts[index]
    })
    return values
}

function commandUsage(endpoint, usedPrefix) {
    const automaticFields = new Set(['username', 'guildName', 'servername', 'avatar', 'memberCount', 'userLevel', 'currxp', 'needxp', 'level'])
    const fields = endpoint.args.filter(field => !Object.hasOwn(endpoint.defaults, field) && !automaticFields.has(field) && field !== endpoint.mediaField)
    const args = fields.length ? ` ${fields.join(' | ')}` : ''
    const media = endpoint.mediaField ? ` [URL o archivo citado para ${endpoint.mediaField}]` : ''
    return `Uso: ${usedPrefix}${endpoint.command}${args}${media}`
}

function mediaType(endpoint, item, url) {
    if (endpoint.output !== 'media') return endpoint.output
    const mime = `${item?.mimetype || item?.mimeType || item?.type || ''}`.toLowerCase()
    if (mime.includes('audio') || /\.(mp3|m4a|ogg|opus|wav)(\?|$)/i.test(url)) return 'audio'
    if (mime.includes('image') || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)) return 'image'
    if (mime.includes('pdf') || /\.pdf(\?|$)/i.test(url)) return 'document'
    return 'video'
}

function toReadableText(data) {
    const result = data?.result ?? data?.data ?? data
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2) || 'La API respondió sin contenido.'
    return stripEmojis(text.length > 3500 ? `${text.slice(0, 3500)}\n[Respuesta truncada]` : text)
}

function makeMediaMessage(endpoint, data, url) {
    const item = extractMediaItem(data)
    const type = mediaType(endpoint, item, url)
    const caption = `${item.title || item.name || endpoint.title}\nCharly Bot`
    if (type === 'audio') return {
        audio: { url },
        mimetype: item.mimetype || item.mimeType || 'audio/mpeg',
        fileName: item.fileName || item.filename || `${endpoint.command}.mp3`,
        ...(getMediaDurationSeconds(item) ? { seconds: getMediaDurationSeconds(item) } : {})
    }
    if (type === 'document') return { document: { url }, mimetype: item.mimetype || item.mimeType || 'application/octet-stream', fileName: item.fileName || item.filename || `${endpoint.command}`, caption }
    if (type === 'image') return { image: { url }, caption }
    return { video: { url }, caption, mimetype: item.mimetype || item.mimeType || 'video/mp4' }
}

async function uploadQuotedMedia(endpoint, m, values) {
    if (!endpoint.mediaField || values[endpoint.mediaField]) return
    const source = m.quoted?.download ? m.quoted : m.msg?.mimetype && m.download ? m : null
    if (!source) return
    const buffer = await source.download()
    const url = await uploadToEvo(buffer)
    if (url) values[endpoint.mediaField] = url
}

async function addAutomaticFields(values, endpoint, m, conn, user) {
    const metadataFields = ['username', 'guildName', 'servername', 'avatar', 'memberCount', 'userLevel', 'currxp', 'needxp', 'level']
    if (!metadataFields.some(field => endpoint.args.includes(field))) return

    if (endpoint.args.includes('username') && !values.username) values.username = user?.name || m.pushName || 'Usuario'
    if (endpoint.args.includes('guildName') && !values.guildName) {
        const metadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
        values.guildName = metadata?.subject || 'WhatsApp'
    }
    if (endpoint.args.includes('servername') && !values.servername) {
        const metadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
        values.servername = metadata?.subject || 'WhatsApp'
    }
    if (endpoint.args.includes('memberCount') && !values.memberCount) {
        const metadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
        values.memberCount = String(metadata?.participants?.length || 1)
    }
    if (endpoint.args.includes('avatar') && !values.avatar) {
        values.avatar = await conn.profilePictureUrl(m.sender, 'image').catch(() => null)
            || 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg'
    }
    if (endpoint.args.includes('userLevel') && !values.userLevel) values.userLevel = String(user?.level || 0)
    if (endpoint.args.includes('level') && !values.level) values.level = String(user?.level || 0)
    if (endpoint.args.includes('currxp') && !values.currxp) values.currxp = String(user?.exp || 0)
    if (endpoint.args.includes('needxp') && !values.needxp) {
        const level = Number(user?.level) || 0
        values.needxp = String((level + 1) ** 2 * 36)
    }
}

async function runEndpoint(endpoint, m, context) {
    const { conn, text, usedPrefix, user, chat } = context
    if (endpoint.nsfw && (!m.isGroup || !chat?.nsfw)) {
        return m.reply('Este comando solo funciona en un grupo con el modo para adultos habilitado por un administrador.')
    }

    const hasAttachment = Boolean(m.quoted?.download || (m.msg?.mimetype && m.download))
    const values = parseInput(endpoint, text || m.quoted?.text || '', hasAttachment)
    if (!values) return m.reply(`Formato de parámetros no válido.\n${commandUsage(endpoint, usedPrefix)}`)

    await addAutomaticFields(values, endpoint, m, conn, user)
    try {
        await uploadQuotedMedia(endpoint, m, values)
    } catch (error) {
        console.error(`No se pudo preparar el archivo para ${endpoint.path}:`, error.message)
        return m.reply('No se pudo preparar el archivo adjunto. Responde a una imagen, audio, video o documento compatible.')
    }

    const params = { ...endpoint.defaults, ...values }
    const missing = endpoint.required.filter(name => params[name] === undefined || params[name] === null || params[name] === '')
    if (missing.length) {
        return m.reply(`Faltan parámetros: ${missing.join(', ')}.\n${commandUsage(endpoint, usedPrefix)}`)
    }

    try {
        const data = endpoint.method === 'POST'
            ? await evoPostForm(endpoint.path, params, { includeApiKey: endpoint.includeApiKey })
            : await evoGet(endpoint.path, params, { includeApiKey: endpoint.includeApiKey })

        if (!apiSucceeded(data)) return m.reply(`La API no pudo completar la solicitud.\n${toReadableText(data)}`)

        if (endpoint.output !== 'text') {
            const url = extractMediaUrl(data)
            if (url) {
                await conn.sendMessage(m.chat, makeMediaMessage(endpoint, data, url), { quoted: m })
                return
            }
        }
        return m.reply(toReadableText(data))
    } catch (error) {
        console.error(`Error en ${endpoint.path}:`, error.message)
        return m.reply(`No se pudo completar la solicitud a Evo: ${error.message}`)
    }
}

const handler = async (m, context) => {
    if (context.command === 'evo') {
        const sections = categories.map(category => {
            const names = endpoints
                .filter(item => item.category === category && !item.blocked)
                .flatMap(item => (item.existing || item.command).split(' / '))
            return `*${category}*\n${names.map(name => `${context.usedPrefix}${name}`).join(' · ')}`
        })
        return m.reply(`┏━━━━━━━━━━━━━━━━━━━━┓\n┃   CATÁLOGO DE EVO   ┃\n┗━━━━━━━━━━━━━━━━━━━━┛\n\n${sections.join('\n\n')}`)
    }

    const endpoint = endpointByCommand.get(context.command)
    if (!endpoint) return m.reply('El endpoint solicitado no está disponible.')
    return runEndpoint(endpoint, m, context)
}

handler.help = ['evo', ...commands.map(item => commandUsage(item, '.'))]
handler.tags = ['evo']
handler.command = ['evo', ...commands.map(item => item.command)]

export { endpoints as evoEndpoints }
export default handler