import assert from 'node:assert/strict'
import { rm, writeFile } from 'node:fs/promises'
import { afterEach, beforeEach, test } from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import { getCommand } from '../core/loader.js'
import ffmpegPath from 'ffmpeg-static'
import ytmp3Handler from '../cmds/descargas/ytmp3.js'
import videoHandler from '../cmds/descargas/video.js'
import playHandler from '../cmds/descargas/play.js'
import pinterestHandler from '../cmds/descargas/pinterest.js'
import spotifyHandler from '../cmds/descargas/spotify.js'
import ytsearchHandler from '../cmds/herramientas/ytsearch.js'
import menuHandler from '../cmds/main/menu.js'
import evoCatalog from '../cmds/evo_catalog.js'
import { extractMediaUrl } from '../core/evogb.js'
import {
    extractFirstSearchResult,
    getMediaDurationSeconds,
    extractSpotifyUrl,
    extractYouTubeUrl,
    formatMediaDetails,
    isSpotifyUrl,
    isYouTubeUrl
} from '../core/downloaders.js'

const originalFetch = global.fetch
const originalApiKey = process.env.EVO_API_KEY

beforeEach(() => {
    process.env.EVO_API_KEY = 'test-key'
})

afterEach(() => {
    global.fetch = originalFetch
    if (originalApiKey === undefined) delete process.env.EVO_API_KEY
    else process.env.EVO_API_KEY = originalApiKey
})

function jsonResponse(data) {
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    })
}

function mockApi(responses) {
    const requests = []
    global.fetch = async (input, options = {}) => {
        const url = new URL(input)
        requests.push({ url, options })
        const response = responses(url, options, requests.length)
        if (!response) throw new Error(`Unexpected request: ${url.pathname}`)
        return response instanceof Response ? response : jsonResponse(response)
    }
    return requests
}

function commandContext(command, text) {
    const messages = []
    const replies = []
    const m = {
        chat: 'test-chat',
        sender: '123@s.whatsapp.net',
        quoted: null,
        reply: async value => replies.push(value)
    }
    const conn = {
        sendMessage: async (_chat, content) => messages.push(content)
    }
    return { m, conn, messages, replies, context: { conn, command, text, usedPrefix: '.' } }
}

function createVideoFixture() {
    return execFileSync(ffmpegPath, [
        '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=64x64:d=1',
        '-c:v', 'mpeg4', '-pix_fmt', 'yuv420p', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1'
    ], { maxBuffer: 1024 * 1024 })
}

test('downloaders distinguish direct links from searches and extract the first result', () => {
    const result = extractFirstSearchResult({ status: true, data: { results: [
        { title: 'First', videoId: 'abcdefghijk' },
        { title: 'Second', url: 'https://youtu.be/second12345' }
    ] } })

    assert.equal(result.title, 'First')
    assert.equal(extractYouTubeUrl(result), 'https://www.youtube.com/watch?v=abcdefghijk')
    assert.equal(extractYouTubeUrl({ title: 'Search', url: 'https://youtube.com/watch', banner: 'https://i.ytimg.com/vi/M5RiDEfnPVU/hq720.jpg' }), 'https://www.youtube.com/watch?v=M5RiDEfnPVU')
    assert.equal(isYouTubeUrl('youtu.be/abcdefghijk'), true)
    assert.equal(isYouTubeUrl('https://example.com/video'), false)
    assert.equal(isSpotifyUrl('open.spotify.com/track/123'), true)
    assert.equal(extractSpotifyUrl({ id: '1234567890123456789012' }), 'https://open.spotify.com/track/1234567890123456789012')
    assert.equal(getMediaDurationSeconds({ duration: '3:12' }), 192)
    assert.equal(getMediaDurationSeconds({ duration: '01:02:03' }), 3723)
    assert.equal(getMediaDurationSeconds({ duration: 0, durationText: '2m 5s' }), 125)
    assert.equal(getMediaDurationSeconds({ duration: '0:00' }), undefined)
    assert.match(formatMediaDetails({ title: 'Track', likes: 12, publishedAt: '2026-01-01' }), /Me gusta: 12\nReproducciones: No disponible\nEmisión: 2026-01-01/)
})

test('.ytmp3 searches first, downloads that URL, and sends audio last', async () => {
    const requests = mockApi(url => {
        if (url.pathname === '/search/yt') return { status: true, result: [{
            title: 'Que Loke',
            author: 'Artista',
            url: 'https://www.youtube.com/watch?v=abcdefghijk',
            thumbnail: 'https://img.example/cover.jpg',
            duration: '3:12',
            likes: 45,
            publishedTime: '2025-01-01'
        }] }
        if (url.pathname === '/dl/ytmp3') return { status: true, result: {
            title: 'Que Loke',
            downloadUrl: 'https://cdn.example/audio.mp3',
            mimetype: 'audio/mpeg'
        } }
        return null
    })
    const command = commandContext('ytmp3', 'Que Loke')

    await ytmp3Handler(command.m, command.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/search/yt', '/dl/ytmp3'])
    assert.equal(requests[1].url.searchParams.get('url'), 'https://www.youtube.com/watch?v=abcdefghijk')
    assert.equal(command.messages[0].image.url, 'https://img.example/cover.jpg')
    assert.match(command.messages[0].caption, /Autor: Artista/)
    assert.match(command.messages[0].caption, /Me gusta: 45/)
    assert.match(command.messages[0].caption, /Emisión: 2025-01-01/)
    assert.equal(command.messages.at(-1).audio.url, 'https://cdn.example/audio.mp3')
    assert.equal(command.messages.at(-1).seconds, 192)
    assert.equal(command.replies.length, 0)
})

test('.ytmp3 and .ytmp4 accept search text while .ytmp3 accepts a direct link', async () => {
    const videoBytes = createVideoFixture()
    const requests = mockApi(url => {
        if (url.pathname === '/search/yt') return { status: true, result: [{
            title: 'Search result',
            url: 'https://www.youtube.com/watch?v=abcdefghijk'
        }] }
        if (url.pathname === '/dl/ytmp3') return { status: true, result: { downloadUrl: 'https://cdn.example/audio.mp3' } }
        if (url.pathname === '/dl/ytmp4') return { status: true, result: { downloadUrl: 'https://cdn.example/video.mp4' } }
        if (url.hostname === 'cdn.example') return new Response(videoBytes, {
            headers: { 'content-type': 'video/mp4' }
        })
        return null
    })
    const audio = commandContext('ytmp3', 'https://youtu.be/abcdefghijk')
    const video = commandContext('video', 'Search result')

    await ytmp3Handler(audio.m, audio.context)
    await videoHandler(video.m, video.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/dl/ytmp3', '/search/yt', '/dl/ytmp4', '/video.mp4'])
    assert.equal(requests[0].url.searchParams.get('url'), 'https://youtu.be/abcdefghijk')
    assert.equal(requests[2].url.searchParams.get('quality'), '480')
    assert.notDeepEqual(video.messages.at(-1).video, videoBytes)
    const decoded = spawnSync(ffmpegPath, [
        '-hide_banner', '-i', 'pipe:0', '-f', 'null', '-'
    ], { input: video.messages.at(-1).video, maxBuffer: 1024 * 1024 })
    assert.equal(decoded.status, 0, decoded.stderr.toString())
    assert.match(decoded.stderr.toString(), /Video: h264/)
    assert.match(decoded.stderr.toString(), /yuv420p/)
})

test('.video and .ytmp4 use the same video endpoint at quality 480', async () => {
    const videoBytes = createVideoFixture()
    const requests = mockApi(url => {
        if (url.pathname === '/dl/ytmp4') return { status: true, result: {
            title: 'Direct video',
            author: 'Direct author',
            duration: '3:12',
            thumbnail: 'https://img.example/video.jpg',
            downloadUrl: 'https://cdn.example/video.mp4',
            mimetype: 'video/mp4'
        } }
        if (url.hostname === 'cdn.example') return new Response(videoBytes, {
            headers: { 'content-type': 'video/mp4' }
        })
        return null
    })
    const command = commandContext('ytmp4', 'https://youtu.be/abcdefghijk')

    await videoHandler(command.m, command.context)

    assert.equal(requests.length, 2)
    assert.equal(requests[0].url.pathname, '/dl/ytmp4')
    assert.equal(requests[0].url.searchParams.get('quality'), '480')
    assert.equal(requests[0].url.searchParams.get('url'), 'https://youtu.be/abcdefghijk')
    assert.equal(requests[1].url.href, 'https://cdn.example/video.mp4')
    assert.equal(command.messages.length, 1)
    assert.notDeepEqual(command.messages[0].video, videoBytes)
    assert.equal(command.messages[0].seconds, 192)
    assert.match(command.messages[0].caption, /Título: Direct video/)
    assert.match(command.messages[0].caption, /Autor: Direct author/)
    assert.equal(command.messages[0].image, undefined)
    assert.deepEqual(videoHandler.command, ['video', 'ytmp4', 'ytvideo'])
    assert.deepEqual((await getCommand('ytvideo')).command, videoHandler.command)
})

test('.ytmp4 includes a JPEG preview inside the video message', async () => {
    const videoBytes = createVideoFixture()
    mockApi(url => {
        if (url.pathname === '/dl/ytmp4') return { status: true, result: { downloadUrl: 'https://cdn.example/video.mp4' } }
        if (url.hostname === 'cdn.example') return new Response(videoBytes, { headers: { 'content-type': 'video/mp4' } })
        return null
    })
    const command = commandContext('ytmp4', 'https://youtu.be/abcdefghijk')

    await videoHandler(command.m, command.context)

    assert.equal(command.messages.length, 1)
    assert.notDeepEqual(command.messages[0].video, videoBytes)
    assert.deepEqual(command.messages[0].jpegThumbnail.subarray(0, 2), Buffer.from([0xff, 0xd8]))
    assert.equal(command.messages[0].image, undefined)
})

test('.ytmp4 does not send a video when the download server fails', async () => {
    mockApi(url => {
        if (url.pathname === '/dl/ytmp4') return { status: true, result: {
            downloadUrl: 'https://cdn.example/video.mp4'
        } }
        if (url.hostname === 'cdn.example') return new Response('Unavailable', { status: 503 })
        return null
    })
    const command = commandContext('ytmp4', 'https://youtu.be/abcdefghijk')

    await videoHandler(command.m, command.context)

    assert.equal(command.messages.length, 0)
    assert.equal(command.replies.length, 1)
    assert.match(command.replies[0], /No se pudo completar la descarga/)
})

test('.play and .play2 use youtubeplay with the correct media type and header auth', async () => {
    const requests = mockApi(url => url.pathname === '/dl/youtubeplay' ? { status: true, result: {
        title: 'Play result',
        thumbnail: 'https://img.example/play.jpg',
        duration: { seconds: 192, timestamp: '3:12' },
        url: 'https://www.youtube.com/watch?v=abcdefghijk',
        dl: 'https://cdn.example/play-media.mp4',
        download: { url: 'https://cdn.example/play-media.mp4', type: 'video/mp4' }
    } } : null)

    for (const [commandName, expectedType, expectedMedia] of [['play', 'audio', 'audio'], ['play2', 'video', 'video']]) {
        const command = commandContext(commandName, 'Me prometi')
        await playHandler(command.m, command.context)
        const request = requests.at(-1)
        assert.equal(request.url.pathname, '/dl/youtubeplay')
        assert.equal(request.url.searchParams.get('query'), 'Me prometi')
        assert.equal(request.url.searchParams.get('type'), expectedType)
        assert.equal(request.options.headers['x-api-key'], 'test-key')
        if (commandName === 'play2') assert.equal(request.url.searchParams.get('quality'), '480')
        assert.equal(command.messages.at(-1)[expectedMedia].url, 'https://cdn.example/play-media.mp4')
        if (commandName === 'play') assert.equal(command.messages.at(-1).seconds, 192)
    }
})

test('media extraction prefers a downloadable file over a YouTube watch page', () => {
    assert.equal(extractMediaUrl({ data: {
        url: 'https://www.youtube.com/watch?v=abcdefghijk',
        dl: 'https://cdn.example/audio.mp3'
    } }), 'https://cdn.example/audio.mp3')
    assert.equal(extractMediaUrl({ data: {
        url: 'https://www.youtube.com/watch?v=abcdefghijk',
        download: { url: 'https://cdn.example/video.mp4' }
    } }), 'https://cdn.example/video.mp4')
    assert.equal(extractMediaUrl({ data: {
        url: 'https://www.youtube.com/watch?v=abcdefghijk',
        download: 'https://cdn.example/direct-video.mp4'
    } }), 'https://cdn.example/direct-video.mp4')
})

test('.play and .play2 are registered by the command loader', async () => {
    const play = await getCommand('play')
    const play2 = await getCommand('play2')

    assert.ok(play)
    assert.ok(play2)
    assert.deepEqual(play.command, ['play', 'play2'])
    assert.equal(await getCommand('audio'), null)
    assert.equal(await getCommand('mp3'), null)
})

test('.reload is owner-only and rebuilds the command registry', async () => {
    const reload = await getCommand('reload')
    const previousPlayHandler = await getCommand('play')
    assert.ok(reload)
    assert.ok(previousPlayHandler)

    const denied = commandContext('reload', '')
    await reload(denied.m, { ...denied.context, isOwner: false })
    assert.match(denied.replies[0], /Solo el propietario/)

    const allowed = commandContext('reload', '')
    await reload(allowed.m, { ...allowed.context, isOwner: true })
    assert.match(allowed.replies[0], /Comandos actualizados: \d+ módulos y \d+ nombres de comando/)
    assert.notEqual(await getCommand('play'), previousPlayHandler)
    assert.ok(await getCommand('recargar'))
})

test('command loader automatically refreshes added, edited, and removed files', async () => {
    const alias = `watchreload${process.pid}${Date.now()}`
    const filePath = path.join(process.cwd(), 'cmds', 'main', `${alias}.js`)
    const waitFor = async predicate => {
        const deadline = Date.now() + 5000
        while (Date.now() < deadline) {
            const result = await predicate()
            if (result) return result
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        throw new Error('Timed out waiting for the command watcher.')
    }

    try {
        await writeFile(filePath, `const handler = () => {}; handler.command = ['${alias}']; handler.version = 1; export default handler\n`)
        const addedCommand = await waitFor(() => getCommand(alias))
        assert.equal(addedCommand.version, 1)

        await writeFile(filePath, `const handler = () => {}; handler.command = ['${alias}']; handler.version = 2; export default handler\n`)
        const updatedCommand = await waitFor(async () => {
            const command = await getCommand(alias)
            return command?.version === 2 ? command : null
        })
        assert.equal(updatedCommand.version, 2)
    } finally {
        await rm(filePath, { force: true })
        await waitFor(async () => (await getCommand(alias)) === null)
    }
})

test('duplicate WhatsApp message IDs are processed only once', async () => {
    const { isDuplicateMessage } = await import('../core/message-dedupe.js')
    const message = { chat: 'test-chat', sender: '123@s.whatsapp.net', key: { id: 'message-1', remoteJid: 'test-chat' } }

    assert.equal(isDuplicateMessage(message), false)
    assert.equal(isDuplicateMessage(message), true)
    assert.equal(isDuplicateMessage({ ...message, key: { ...message.key, id: 'message-2' } }), false)
})

test('.spotify searches first and sends downloaded audio after track details', async () => {
    const requests = mockApi(url => {
        if (url.pathname === '/search/spotify') return { status: true, result: [{
            title: 'Mask Off',
            artist: 'Future',
            trackUrl: 'https://open.spotify.com/track/1234567890123456789012',
            image: 'https://img.example/spotify.jpg',
            duration: '2:40'
        }] }
        if (url.pathname === '/dl/spotify') return { status: true, result: {
            title: 'Mask Off',
            downloadUrl: 'https://cdn.example/spotify.mp3'
        } }
        return null
    })
    const command = commandContext('spotify', 'Mask Off')

    await spotifyHandler(command.m, command.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/search/spotify', '/dl/spotify'])
    assert.equal(requests[1].url.searchParams.get('url'), 'https://open.spotify.com/track/1234567890123456789012')
    assert.equal(command.messages[0].image.url, 'https://img.example/spotify.jpg')
    assert.match(command.messages[0].caption, /Autor: Future/)
    assert.equal(command.messages.at(-1).audio.url, 'https://cdn.example/spotify.mp3')
    assert.equal(command.messages.at(-1).seconds, 160)
})

test('.spotify accepts a direct track URL without a search request', async () => {
    const requests = mockApi(url => url.pathname === '/dl/spotify' ? { status: true, result: {
        title: 'Direct track',
        downloadUrl: 'https://cdn.example/direct-spotify.mp3'
    } } : null)
    const command = commandContext('spotify', 'open.spotify.com/track/1234567890123456789012')

    await spotifyHandler(command.m, command.context)

    assert.equal(requests.length, 1)
    assert.equal(requests[0].url.searchParams.get('url'), 'https://open.spotify.com/track/1234567890123456789012')
    assert.equal(command.messages.at(-1).audio.url, 'https://cdn.example/direct-spotify.mp3')
})

test('.spotify reports Evo server errors clearly', async () => {
    global.fetch = async () => { throw new Error('Evo respondió con HTTP 500') }
    const command = commandContext('spotify', 'https://open.spotify.com/track/1234567890123456789012')

    await spotifyHandler(command.m, command.context)

    assert.match(command.replies[0], /Evo.*HTTP 500/)
})

test('.ytsearch displays results without adding message reactions', async () => {
    mockApi(url => url.pathname === '/search/yt' ? { status: true, result: [{
        title: 'Search result',
        author: 'Artist',
        url: 'https://www.youtube.com/watch?v=abcdefghijk',
        thumbnail: 'https://img.example/search.jpg',
        duration: '2:30',
        likes: 10
    }] } : null)
    const command = commandContext('ytsearch', 'Search result')

    await ytsearchHandler(command.m, command.context)

    assert.equal(command.messages[0].image.url, 'https://img.example/search.jpg')
    assert.match(command.messages[0].caption, /Autor: Artist/)
    assert.match(command.messages[0].caption, /Me gusta: 10/)
    assert.equal(command.replies.length, 0)
})

test('Pinterest search sends V1 high-resolution results', async () => {
    const requests = mockApi(url => url.pathname === '/search/pinterest' ? { status: true, data: [{
        title: 'Sunset Beach',
        username: 'pin-user',
        hd: 'https://i.pinimg.com/originals/example.jpg'
    }] } : null)
    const command = commandContext('pinterest', 'paisaje')

    await pinterestHandler(command.m, command.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/search/pinterest'])
    assert.equal(command.messages[0].image.url, 'https://i.pinimg.com/originals/example.jpg')
    assert.equal(command.replies.length, 0)
})

test('Pinterest search falls back to V2 nested pin media', async () => {
    const requests = mockApi(url => {
        if (url.pathname === '/search/pinterest') return { status: false, data: [] }
        if (url.pathname === '/search/pinterestv2') return { status: true, response: { pins: [{
            title: 'Forest',
            pin_url: 'https://pinterest.com/pin/forest-v2-pin/',
            media: { images: { orig: { url: 'https://i.pinimg.com/originals/forest.jpg' } } }
        }] } }
        return null
    })
    const command = commandContext('pinterest', 'bosque')

    await pinterestHandler(command.m, command.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/search/pinterest', '/search/pinterestv2'])
    assert.equal(command.messages[0].image.url, 'https://i.pinimg.com/originals/forest.jpg')
    assert.equal(command.replies.length, 0)
})

test('Pinterest can reuse a pin URL returned by its search', async () => {
    const requests = mockApi(url => url.pathname === '/search/pinterest' ? { status: true, data: [{
        id: 'cached-pin-id',
        title: 'Cached image',
        hd: 'https://i.pinimg.com/originals/cached.jpg'
    }] } : null)
    const search = commandContext('pinterest', 'cached test')
    await pinterestHandler(search.m, search.context)

    const direct = commandContext('pinterest', 'https://pinterest.com/pin/cached-pin-id/')
    await pinterestHandler(direct.m, direct.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/search/pinterest'])
    assert.match(search.messages[0].caption, /https:\/\/www\.pinterest\.com\/pin\/cached-pin-id\//)
    assert.equal(direct.messages[0].image.url, 'https://i.pinimg.com/originals/cached.jpg')
    assert.equal(direct.replies.length, 0)
})

test('Pinterest video search uses a pin thumbnail when Evo only provides HLS', async () => {
    const requests = mockApi(url => {
        if (url.pathname === '/search/pinterest') return { status: true, data: [] }
        if (url.pathname === '/search/pinterestv2') return { status: true, response: { pins: [{
            title: 'Dance video',
            pin_url: 'https://pinterest.com/pin/hls-video-pin/',
            media: { video: { video_list: { V_HLSV4: {
                url: 'https://v1.pinimg.com/videos/sample.m3u8',
                thumbnail: 'i.pinimg.com/videos/thumbnails/sample.jpg'
            } } } }
        }] } }
        return null
    })
    const command = commandContext('pinterest', 'video baile')

    await pinterestHandler(command.m, command.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/search/pinterest', '/search/pinterestv2'])
    assert.equal(command.messages[0].image.url, 'https://i.pinimg.com/videos/thumbnails/sample.jpg')
    assert.equal(command.messages[0].video, undefined)
})

test('Pinterest URL input calls the downloader without searching', async () => {
    const requests = mockApi(url => url.pathname === '/dl/pinterest' ? { status: true, data: {
        title: 'Pin video',
        type: 'video',
        url: 'https://cdn.example/pin.mp4'
    } } : null)
    const command = commandContext('pinterest', 'https://www.pinterest.com/pin/direct-download-pin/')

    await pinterestHandler(command.m, command.context)

    assert.deepEqual(requests.map(request => request.url.pathname), ['/dl/pinterest'])
    assert.equal(requests[0].url.searchParams.get('url'), 'https://www.pinterest.com/pin/direct-download-pin/')
    assert.equal(command.messages[0].video.url, 'https://cdn.example/pin.mp4')
    assert.equal(command.replies.length, 0)
})

test('menu sends its cover preview and every command in one message', async () => {
    const messages = []
    const conn = { sendMessage: async (_chat, content) => messages.push(content) }
    await menuHandler({ chat: 'test-chat', sender: '123@s.whatsapp.net', pushName: 'Usuario' }, { conn, usedPrefix: '.' })
    const menuMessage = messages[0]
    const completeMenu = menuMessage?.text || ''

    assert.equal(messages.length, 1)
    assert.equal(menuMessage.contextInfo.externalAdReply.title, 'CHARLY BOT · GRIMORIO')
    assert.equal(menuMessage.contextInfo.externalAdReply.thumbnailUrl, 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png')
    assert.match(completeMenu, /╭━━━〔 ✦ CHARLY BOT ✦ 〕━━━╮/)
    assert.match(completeMenu, /│ Hola, Usuario/)
    assert.match(completeMenu, /CONTENIDO PARA ADULTOS[^\n]*\n│ \.nsfwinteraction\n│   Envía contenido adulto de la interacción seleccionada\./)
    assert.match(completeMenu, /📚 Lista de comandos/)
    assert.ok(completeMenu.length > 10000)
    assert.ok(completeMenu.length < 65536)
    const aliases = [...completeMenu.matchAll(/(?:^|│ | \/ )\.([a-z0-9_-]+)/gmi)].map(match => match[1])
    assert.equal(aliases.length, 288)
    assert.equal(new Set(aliases).size, aliases.length)
    for (const alias of ['ytmp3', 'ytmp4', 'ytvideo', 'video', 'play', 'play2', 'spotify', 'reload', 'recargar']) {
        assert.ok(aliases.includes(alias))
    }
    assert.match(completeMenu, /│ \.ytmp3\n│   Busca y descarga audio MP3 de YouTube\./)
    assert.match(completeMenu, /│ \.play2\n│   Busca en YouTube y envía el video correspondiente\./)
    assert.match(completeMenu, /│ \.pinterest(?: \/ \.[a-z0-9_-]+)*\n│   Busca imágenes de Pinterest o procesa un enlace de pin\./)
    assert.doesNotMatch(completeMenu, /Descripción no configurada\./)
    assert.doesNotMatch(completeMenu, /usa el servicio Evo|Utilidad del bot:|Ejecuta la función/)
})

test('menu text is still sent if WhatsApp rejects the cover preview', async () => {
    const messages = []
    const errors = []
    const originalError = console.error
    const conn = {
        sendMessage: async (_chat, content) => {
            if (content.contextInfo?.externalAdReply) throw new Error('preview unavailable')
            messages.push(content)
        }
    }

    console.error = (...args) => errors.push(args)
    try {
        await menuHandler({ chat: 'test-chat', sender: '123@s.whatsapp.net' }, { conn, usedPrefix: '.' })
    } finally {
        console.error = originalError
    }

    assert.equal(messages.length, 1)
    assert.match(messages[0].text, /CHARLY BOT/)
    assert.match(errors[0][0], /\[MENU PREVIEW\]/)
})

test('custom YouTube commands are not intercepted by the generic Evo catalog', () => {
    assert.equal(evoCatalog.command.includes('ytmp3'), false)
    assert.equal(evoCatalog.command.includes('ytmp4'), false)
})