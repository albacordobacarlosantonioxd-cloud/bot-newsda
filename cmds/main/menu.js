import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { evoEndpoints } from '../evo_catalog.js'

const commandsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const categoryNames = {
    descargas: 'Descargas',
    grupo: 'Administración de grupos',
    herramientas: 'Herramientas',
    ia: 'Inteligencia artificial',
    interaccion: 'Interacciones',
    main: 'Comandos generales',
    perfil: 'Perfil y niveles',
    stickers: 'Stickers',
    utilidades: 'Utilidades'
}
const evoCategoryNames = {
    'Adulto': 'Contenido para adultos',
    'Búsquedas': 'Búsquedas',
    'Convertidores': 'Convertidores',
    'Descargas': 'Descargas',
    'Generadores': 'Generadores',
    'Herramientas': 'Herramientas',
    'IA': 'Inteligencia artificial',
    'Perfiles': 'Perfiles públicos',
    'SFW': 'Contenido SFW',
    'Stickers': 'Stickers'
}
const evoEndpointByCommand = new Map(evoEndpoints.flatMap(endpoint => [
    [endpoint.command, endpoint],
    ...(endpoint.existing || '').split(' / ').filter(Boolean).map(alias => [alias, endpoint])
]))
const MENU_IMAGE_URL = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'
const categoryIcons = {
    'Administración de grupos': '👥',
    'Búsquedas': '🔎',
    'Comandos generales': '⚙️',
    'Comandos Evo': '📡',
    'Contenido para adultos': '🔞',
    'Contenido SFW': '🌿',
    'Convertidores': '🔄',
    'Descargas': '⬇️',
    'Generadores': '✨',
    'Herramientas': '🛠️',
    'Inteligencia artificial': '🤖',
    'Interacciones': '💬',
    'Perfiles públicos': '🌐',
    'Perfil y niveles': '🏅',
    'Stickers': '🎨',
    'Utilidades': '🔧'
}
const endpointDescriptions = new Map(Object.entries({
    '/dl/ytmp3': 'Descarga el audio de una URL de YouTube en formato MP3.',
    '/dl/instagram': 'Descarga fotos y videos de publicaciones de Instagram.',
    '/dl/facebookv2': 'Descarga contenido multimedia de Facebook.',
    '/dl/spotify': 'Descarga el audio de una pista de Spotify.',
    '/dl/soundcloud': 'Descarga una pista de SoundCloud.',
    '/dl/dropbox': 'Descarga un archivo compartido de Dropbox.',
    '/dl/pinterest': 'Descarga el contenido multimedia de un pin de Pinterest.',
    '/dl/twitter': 'Descarga fotos o videos de una publicación de X.',
    '/dl/tiktok': 'Descarga un video de TikTok.',
    '/dl/google-drive': 'Descarga archivos o carpetas compartidos de Google Drive.',
    '/dl/ytmp4': 'Descarga un video de YouTube en formato MP4.',
    '/dl/mediafire': 'Descarga un archivo compartido de MediaFire.',
    '/dl/facebook': 'Descarga contenido multimedia de Facebook con el endpoint alternativo.',
    '/dl/tiktokmp3': 'Extrae y descarga el audio MP3 de un video de TikTok.',
    '/dl/tiktokv2': 'Descarga videos de TikTok con el método alternativo.',
    '/dl/threads': 'Descarga contenido multimedia de una publicación de Threads.',
    '/dl/youtubeplay': 'Busca una canción o video de YouTube y descarga el formato solicitado.',
    '/dl/terabox': 'Descarga archivos compartidos de TeraBox.',
    '/dl/deezer': 'Descarga una pista de Deezer.',
    '/tools/country': 'Muestra información general o detallada de un país.',
    '/tools/whatsapp/check-number': 'Comprueba si un número está registrado en WhatsApp.',
    '/tools/tempmail-read': 'Lee los mensajes recibidos en una dirección de correo temporal.',
    '/tools/hostinfo': 'Consulta datos técnicos y registros DNS de un dominio.',
    '/tools/ssweb': 'Captura la pantalla de un sitio web.',
    '/tools/npmjs': 'Busca paquetes y versiones en el registro NPM.',
    '/tools/lyrics': 'Busca letras de canciones y su sincronización.',
    '/tools/whatmusic-shazam': 'Identifica una canción a partir de un audio o video.',
    '/tools/shortlink': 'Acorta una URL y puede asignarle un alias.',
    '/tools/clima': 'Consulta el pronóstico del tiempo de una ciudad.',
    '/tools/removebg': 'Elimina el fondo de una imagen.',
    '/tools/upscale': 'Mejora la resolución de una imagen.',
    '/tools/emojimix': 'Combina dos emojis y devuelve una imagen del resultado.',
    '/tools/remove-vocals': 'Separa la voz y la música de una canción.',
    '/tools/minecraft': 'Consulta el estado y los jugadores de un servidor de Minecraft.',
    '/tools/upload': 'Sube un archivo a uno de los servicios de alojamiento disponibles.',
    '/tools/ocr': 'Extrae texto de una imagen mediante reconocimiento óptico.',
    '/tools/brat': 'Crea una imagen o GIF con texto al estilo Brat.',
    '/tools/translate': 'Traduce texto al idioma indicado.',
    '/tools/compress-image': 'Comprime una imagen para reducir su tamaño.',
    '/tools/compress-pdf': 'Comprime un archivo PDF para reducir su tamaño.',
    '/tools/tempmail': 'Genera una dirección de correo electrónico temporal.',
    '/tools/human-body-detection': 'Analiza una imagen para detectar contenido sensible.',
    '/tools/whatsapp/inspect': 'Obtiene información de un enlace de grupo, canal o comunidad de WhatsApp.',
    '/generate/quote-basic': 'Genera una imagen de una cita con formato Markdown.',
    '/generate/quote-image': 'Crea una imagen de mensaje con el fondo seleccionado.',
    '/generate/filters': 'Aplica un filtro visual a una imagen.',
    '/generate/animated-gif': 'Crea un GIF animado a partir de una imagen o video.',
    '/generate/level-card': 'Genera una tarjeta con el nivel y la experiencia del usuario.',
    '/generate/levelup': 'Genera una imagen de subida de nivel con un avatar.',
    '/generate/rank': 'Genera una tarjeta de rango con nivel y experiencia.',
    '/generate/bye-image': 'Crea una imagen de despedida para un miembro.',
    '/generate/welcome2': 'Genera una tarjeta alternativa de bienvenida.',
    '/generate/welcome-card': 'Genera una tarjeta de bienvenida personalizada.',
    '/generate/gay': 'Aplica un filtro Pride a una imagen.',
    '/generate/horny': 'Genera una imagen meme a partir de un avatar.',
    '/generate/welcome-image': 'Crea una tarjeta de bienvenida para un miembro.',
    '/generate/quote': 'Crea una burbuja de mensaje con el estilo indicado.',
    '/generate/quote-stories': 'Genera una cita en formato de historia.',
    '/stalking/instagram': 'Muestra información de un perfil público de Instagram.',
    '/stalking/tiktok': 'Muestra estadísticas de un perfil de TikTok.',
    '/stalking/roblox': 'Muestra información de un jugador de Roblox.',
    '/stalking/telegram': 'Muestra información de un canal público de Telegram.',
    '/stalking/github': 'Muestra información de un perfil de GitHub.',
    '/ai/free': 'Responde preguntas con uno de los modelos gratuitos disponibles.',
    '/ai/chatgpt': 'Responde preguntas usando ChatGPT.',
    '/ai/gptprompt': 'Responde con ChatGPT y el prompt personalizado indicado.',
    '/ai/copilot': 'Responde preguntas usando Microsoft Copilot.',
    '/ai/gemini': 'Responde preguntas usando Google Gemini.',
    '/ai/gpt4-session': 'Conversa con GPT manteniendo el contexto de una sesión.',
    '/ai/image-to-prompt': 'Analiza una imagen y genera un prompt descriptivo.',
    '/ai/qwen': 'Responde preguntas usando el modelo Qwen.',
    '/ai/nanobanana': 'Edita una imagen con IA a partir de una instrucción.',
    '/ai/claude': 'Responde preguntas usando Claude.',
    '/ai/toreal': 'Transforma una imagen de estilo anime en una imagen fotorrealista.',
    '/nsfw/interaction': 'Envía contenido adulto de la interacción seleccionada.',
    '/nsfw/rule34': 'Busca contenido adulto en Rule34 por etiquetas.',
    '/nsfw/dl/xvideos': 'Descarga un video de Xvideos.',
    '/nsfw/dl/xnxx': 'Descarga un video de Xnxx.',
    '/nsfw/random/trapito': 'Envía contenido adulto aleatorio de la categoría seleccionada.',
    '/porn/image/gay': 'Envía una imagen de contenido adulto de la categoría solicitada.',
    '/porn/video/gay': 'Envía un video de contenido adulto de la categoría solicitada.',
    '/nsfw/random/hentai': 'Envía contenido adulto aleatorio de anime.',
    '/nsfw/random/furro': 'Envía contenido adulto aleatorio de la categoría solicitada.',
    '/nsfw/random/yuri': 'Envía contenido adulto aleatorio de la categoría solicitada.',
    '/nsfw/safebooru': 'Busca imágenes por etiqueta en Safebooru.',
    '/nsfw/search/xnxx': 'Busca videos en Xnxx.',
    '/nsfw/random/yuri2': 'Envía contenido adulto aleatorio de la categoría solicitada.',
    '/nsfw/gelbooru': 'Busca imágenes en Gelbooru.',
    '/porn/image/straight': 'Envía una imagen de contenido adulto de la categoría solicitada.',
    '/nsfw/search/pornhub': 'Busca videos en Pornhub.',
    '/nsfw/detect': 'Analiza archivos multimedia para detectar contenido sensible.',
    '/nsfw/detect-free': 'Analiza una imagen para detectar contenido sensible.',
    '/porn/video/straight': 'Envía un video de contenido adulto de la categoría solicitada.',
    '/nsfw/video/hentai': 'Envía un video de anime para adultos.',
    '/nsfw/video/yaoi': 'Envía un video de contenido adulto de la categoría solicitada.',
    '/nsfw/video/trans': 'Envía un video de contenido adulto de la categoría solicitada.',
    '/nsfw/rnd': 'Envía contenido adulto aleatorio del tipo indicado.',
    '/nsfw/detect/v4': 'Analiza archivos multimedia con el detector avanzado de contenido sensible.',
    '/nsfw/random/femboy': 'Envía contenido adulto aleatorio de la categoría solicitada.',
    '/nsfw/danbooru': 'Busca imágenes por etiqueta en Danbooru.',
    '/nsfw/search/xvideos': 'Busca videos en Xvideos.',
    '/sfw/rnd': 'Envía contenido aleatorio apto para todo público.',
    '/sfw/rnd/v2': 'Envía contenido aleatorio apto para todo público con el buscador alternativo.',
    '/sfw/loli': 'Envía imágenes de anime no explícitas.',
    '/sfw/neko': 'Envía una imagen SFW de temática neko.',
    '/sfw/bluearchive': 'Envía una imagen SFW de Blue Archive.',
    '/sfw/boys': 'Envía contenido SFW de la categoría indicada.',
    '/sfw/gays': 'Envía contenido SFW de la categoría indicada.',
    '/sfw/girls': 'Envía contenido SFW de la categoría indicada.',
    '/search/yt': 'Busca videos en YouTube.',
    '/search/soundcloud': 'Busca pistas en SoundCloud.',
    '/search/googleimage': 'Busca imágenes en Google.',
    '/search/bingimage': 'Busca imágenes en Bing.',
    '/search/wikipedia': 'Busca artículos en Wikipedia.',
    '/search/pinterestvideo': 'Busca videos en Pinterest.',
    '/search/apk': 'Busca archivos APK.',
    '/search/spotify': 'Busca pistas en Spotify.',
    '/search/pinterest': 'Busca imágenes y pines en Pinterest.',
    '/search/pinterestv3': 'Busca pines, videos y productos en Pinterest.',
    '/search/tiktok': 'Busca videos en TikTok.',
    '/search/pinterestv2': 'Busca pines en Pinterest con el método alternativo.',
    '/search/deezer': 'Busca canciones o artistas en Deezer.',
    '/search/tenor': 'Busca GIFs en el proveedor seleccionado.',
    '/api/converter-img': 'Convierte y redimensiona una imagen al formato indicado.',
    '/api/converter-img-to-pdf': 'Convierte una o varias imágenes en un PDF.',
    '/api/converter-pdf-to-img': 'Convierte las páginas de un PDF en imágenes.'
}))

const commandDescriptions = new Map()
function addCommandDescriptions(aliases, description) {
    for (const alias of aliases.split(/\s+/)) commandDescriptions.set(alias, description)
}

addCommandDescriptions('ytsearch yts youtube yt', 'Busca videos de YouTube y muestra sus datos.')
addCommandDescriptions('ytmp3', 'Busca y descarga audio MP3 de YouTube.')
addCommandDescriptions('ytmp4 video ytvideo', 'Busca y descarga videos de YouTube.')
addCommandDescriptions('play', 'Busca en YouTube y envía la canción en audio.')
addCommandDescriptions('play2', 'Busca en YouTube y envía el video correspondiente.')
addCommandDescriptions('spotify sp music spt', 'Busca una pista o procesa un enlace de Spotify y descarga su audio.')
addCommandDescriptions('pinterest pin pinter', 'Busca imágenes de Pinterest o procesa un enlace de pin.')
addCommandDescriptions('gdrive drive googledrive', 'Descarga archivos o carpetas compartidos de Google Drive.')
addCommandDescriptions('mediafire mf', 'Descarga archivos compartidos de MediaFire.')
addCommandDescriptions('tiktok tt tk tiktokv2 tt2', 'Descarga videos de TikTok.')
addCommandDescriptions('tiktokmp3 ttmp3', 'Extrae el audio MP3 de un video de TikTok.')
addCommandDescriptions('ig instagram', 'Descarga fotos o videos de publicaciones de Instagram.')
addCommandDescriptions('fb facebook', 'Descarga fotos o videos de publicaciones de Facebook.')
addCommandDescriptions('facebookv1 fbv1', 'Descarga contenido de Facebook con el endpoint alternativo.')
addCommandDescriptions('twitter x', 'Descarga fotos o videos de publicaciones de X.')
addCommandDescriptions('threads', 'Descarga contenido multimedia de Threads.')
addCommandDescriptions('dropbox', 'Descarga un archivo compartido de Dropbox.')
addCommandDescriptions('soundcloud sc', 'Descarga una pista de SoundCloud.')
addCommandDescriptions('terabox', 'Descarga archivos compartidos de TeraBox.')
addCommandDescriptions('deezer', 'Descarga una pista de Deezer.')
addCommandDescriptions('del delete borrar', 'Elimina el mensaje citado en un grupo.')
addCommandDescriptions('demote quitaradmin', 'Quita el rol de administrador a un miembro del grupo.')
addCommandDescriptions('open abrir', 'Permite que todos los miembros envíen mensajes al grupo.')
addCommandDescriptions('close cerrar', 'Restringe el envío de mensajes a los administradores del grupo.')
addCommandDescriptions('kick sacar eliminar', 'Retira del grupo a los miembros mencionados.')
addCommandDescriptions('link enlace', 'Muestra el enlace de invitación del grupo.')
addCommandDescriptions('promote daradmin', 'Concede el rol de administrador a un miembro del grupo.')
addCommandDescriptions('revoke renovar restablecer', 'Restablece el enlace de invitación del grupo.')
addCommandDescriptions('setbannergp setppgp fotogp', 'Cambia la imagen del grupo usando una imagen enviada o citada.')
addCommandDescriptions('setdescgp setgpdesc setdesc', 'Cambia la descripción del grupo.')
addCommandDescriptions('tag hidetag h', 'Menciona a los miembros del grupo sin mostrar sus etiquetas en el texto.')
addCommandDescriptions('acortar short shortlink tiny', 'Acorta una URL y puede asignarle un alias.')
addCommandDescriptions('code', 'Ejecuta código en el entorno de evaluación configurado.')
addCommandDescriptions('comprimir compress opti', 'Reduce el tamaño de una imagen.')
addCommandDescriptions('comprimirpdf compdf optipdf', 'Reduce el tamaño de un archivo PDF.')
addCommandDescriptions('googleimage img imagen foto', 'Busca imágenes en Google.')
addCommandDescriptions('pfp profilepic pp perfil', 'Muestra la foto de perfil de un usuario.')
addCommandDescriptions('qr', 'Genera un código QR a partir del texto indicado.')
addCommandDescriptions('removebg nobg sinfondo rbg', 'Elimina el fondo de una imagen.')
addCommandDescriptions('readmail leermail checkmail', 'Lee mensajes de una dirección de correo temporal.')
addCommandDescriptions('ssweb ss screenshot', 'Toma una captura de pantalla de un sitio web.')
addCommandDescriptions('tempmail mail correo', 'Genera una dirección de correo temporal.')
addCommandDescriptions('traducir translate tr', 'Traduce el texto al idioma solicitado.')
addCommandDescriptions('upscale hd remini mejorar', 'Mejora la resolución de una imagen.')
addCommandDescriptions('ver revelar vv viewonce', 'Descarga y muestra el contenido de un mensaje de visualización única.')
addCommandDescriptions('claude clau', 'Responde preguntas usando Claude.')
addCommandDescriptions('menu help comandos h', 'Muestra los comandos por categoría y tus datos de perfil.')
addCommandDescriptions('reload recargar', 'Recarga los comandos sin reiniciar el bot; solo el propietario.')
addCommandDescriptions('ping p', 'Muestra el tiempo de respuesta del bot.')
addCommandDescriptions('nsfw', 'Activa o desactiva el contenido para adultos en el grupo.')
addCommandDescriptions('afk', 'Activa o desactiva el estado de ausencia del usuario.')
addCommandDescriptions('delbirth', 'Elimina la fecha de cumpleaños del perfil.')
addCommandDescriptions('deldesc deldescription', 'Elimina la descripción del perfil.')
addCommandDescriptions('delgenre', 'Elimina el género guardado en el perfil.')
addCommandDescriptions('delhobby', 'Elimina el pasatiempo guardado en el perfil.')
addCommandDescriptions('divorce divorciar', 'Finaliza el matrimonio registrado entre dos perfiles.')
addCommandDescriptions('lb leaderboard top', 'Muestra la clasificación de niveles del chat.')
addCommandDescriptions('level lvl', 'Muestra el perfil con el nivel actual.')
addCommandDescriptions('marry casarse', 'Propone matrimonio a otro usuario.')
addCommandDescriptions('profile', 'Muestra el perfil, nivel y datos guardados del usuario.')
addCommandDescriptions('setbirth', 'Guarda la fecha de cumpleaños en el perfil.')
addCommandDescriptions('setdescription', 'Guarda una descripción en el perfil.')
addCommandDescriptions('setgenre', 'Guarda el género en el perfil.')
addCommandDescriptions('sethobby', 'Guarda el pasatiempo en el perfil.')
addCommandDescriptions('work trabajar chamba', 'Trabaja para obtener una recompensa del sistema de economía.')
addCommandDescriptions('audiosticker stikeraudio stickeraudio saudio', 'Crea un sticker con audio usando medios enviados o citados.')
addCommandDescriptions('bratv', 'Crea un sticker animado con texto al estilo Brat.')
addCommandDescriptions('s', 'Convierte una imagen en sticker.')
addCommandDescriptions('sticker', 'Crea un sticker a partir de una imagen o un video corto.')
addCommandDescriptions('ss', 'Convierte un video corto en sticker animado.')
addCommandDescriptions('stickerly stly ssearch', 'Busca paquetes de stickers en Sticker.ly.')
addCommandDescriptions('clima weather', 'Consulta el pronóstico del tiempo de una ciudad.')
addCommandDescriptions('githubstalk ghstalk github', 'Muestra información pública de un perfil de GitHub.')
addCommandDescriptions('instagramstalk igstalk iguser', 'Muestra información pública de un perfil de Instagram.')
addCommandDescriptions('tiktokstalk ttstalk', 'Muestra información pública de un perfil de TikTok.')

const localFileDescriptions = new Map([
    ['evo_catalog.js', 'Muestra el catálogo de endpoints disponibles de Evo.'],
    ['descargas/drive.js', 'Descarga archivos o carpetas compartidos de Google Drive.'],
    ['descargas/mf.js', 'Descarga archivos compartidos de MediaFire.'],
    ['descargas/pinterest.js', 'Busca imágenes de Pinterest o procesa enlaces de pines.'],
    ['descargas/play.js', 'Busca contenido de YouTube y descarga audio o video.'],
    ['descargas/socialdl.js', 'Descarga contenido de la plataforma indicada en el comando.'],
    ['descargas/spotify.js', 'Busca pistas o procesa enlaces de Spotify y descarga su audio.'],
    ['descargas/tiktok.js', 'Descarga videos de TikTok.'],
    ['descargas/tiktokmp3.js', 'Extrae el audio MP3 de un video de TikTok.'],
    ['descargas/video.js', 'Busca o descarga videos de YouTube.'],
    ['descargas/ytmp3.js', 'Busca o descarga audio MP3 de YouTube.'],
    ['grupo/del.js', 'Elimina el mensaje citado en un grupo.'],
    ['grupo/demote.js', 'Quita el rol de administrador a un miembro del grupo.'],
    ['grupo/group_toggle.js', 'Abre o cierra el grupo para el envío de mensajes.'],
    ['grupo/kick.js', 'Retira del grupo a los miembros mencionados.'],
    ['grupo/link.js', 'Muestra el enlace de invitación del grupo.'],
    ['grupo/promote.js', 'Concede el rol de administrador a un miembro del grupo.'],
    ['grupo/revoke.js', 'Restablece el enlace de invitación del grupo.'],
    ['grupo/setbannergp.js', 'Cambia la imagen del grupo usando una imagen enviada o citada.'],
    ['grupo/setdescgp.js', 'Cambia la descripción del grupo.'],
    ['grupo/tag.js', 'Menciona a los miembros del grupo sin mostrar sus etiquetas en el texto.'],
    ['herramientas/acortador.js', 'Acorta una URL y puede asignarle un alias.'],
    ['herramientas/code.js', 'Ejecuta código en el entorno de evaluación configurado.'],
    ['herramientas/compressimagen.js', 'Reduce el tamaño de una imagen.'],
    ['herramientas/compresspdf.js', 'Reduce el tamaño de un archivo PDF.'],
    ['herramientas/imagen.js', 'Busca imágenes en Google.'],
    ['herramientas/pfp.js', 'Muestra la foto de perfil de un usuario.'],
    ['herramientas/qr.js', 'Genera un código QR a partir del texto indicado.'],
    ['herramientas/rbg.js', 'Elimina el fondo de una imagen.'],
    ['herramientas/readmail.js', 'Lee mensajes de una dirección de correo temporal.'],
    ['herramientas/ssweb.js', 'Toma una captura de pantalla de un sitio web.'],
    ['herramientas/tempmail.js', 'Genera una dirección de correo temporal.'],
    ['herramientas/translate.js', 'Traduce el texto al idioma solicitado.'],
    ['herramientas/upscaler.js', 'Mejora la resolución de una imagen.'],
    ['herramientas/ver.js', 'Descarga y muestra el contenido de un mensaje de visualización única.'],
    ['herramientas/ytsearch.js', 'Busca videos de YouTube y muestra sus datos.'],
    ['ia/claude.js', 'Responde preguntas usando Claude.'],
    ['interaccion/interaccionnsfw.js', 'Envía contenido adulto de la interacción seleccionada.'],
    ['main/menu.js', 'Muestra el menú por categorías con datos del perfil y del bot.'],
    ['main/ping.js', 'Muestra el tiempo de respuesta del bot.'],
    ['main/toggle_nsfw.js', 'Activa o desactiva el contenido para adultos en el grupo.'],
    ['perfil/afk.js', 'Activa o desactiva el estado de ausencia del usuario.'],
    ['perfil/delbirth.js', 'Elimina la fecha de cumpleaños del perfil.'],
    ['perfil/deldesc.js', 'Elimina la descripción del perfil.'],
    ['perfil/delgenre.js', 'Elimina el género guardado en el perfil.'],
    ['perfil/delhobby.js', 'Elimina el pasatiempo guardado en el perfil.'],
    ['perfil/divorce.js', 'Finaliza el matrimonio registrado entre dos perfiles.'],
    ['perfil/lboard.js', 'Muestra la clasificación de niveles del chat.'],
    ['perfil/level.js', 'Muestra el perfil con el nivel actual.'],
    ['perfil/marry.js', 'Propone matrimonio a otro usuario.'],
    ['perfil/profile.js', 'Muestra el perfil, nivel y datos guardados del usuario.'],
    ['perfil/setbirth.js', 'Guarda la fecha de cumpleaños en el perfil.'],
    ['perfil/setdesc.js', 'Guarda una descripción en el perfil.'],
    ['perfil/setgenre.js', 'Guarda el género en el perfil.'],
    ['perfil/sethobby.js', 'Guarda el pasatiempo en el perfil.'],
    ['perfil/work.js', 'Trabaja para obtener una recompensa del sistema de economía.'],
    ['stickers/audiosticker.js', 'Crea un sticker con audio usando medios enviados o citados.'],
    ['stickers/bratv.js', 'Crea un sticker animado con texto al estilo Brat.'],
    ['stickers/sticker.js', 'Convierte una imagen o un video corto en sticker.'],
    ['stickers/stikerly.js', 'Busca paquetes de stickers en Sticker.ly.'],
    ['utilidades/clima.js', 'Consulta el pronóstico del tiempo de una ciudad.'],
    ['utilidades/githubstalk.js', 'Muestra información pública de un perfil de GitHub.'],
    ['utilidades/igstalk.js', 'Muestra información pública de un perfil de Instagram.'],
    ['utilidades/ttstalk.js', 'Muestra información pública de un perfil de TikTok.']
])

function commandDescription(alias, filePath) {
    const specific = commandDescriptions.get(alias)
    if (specific) return specific
    const endpoint = evoEndpointByCommand.get(alias)
    if (endpointDescriptions.has(endpoint?.path)) return endpointDescriptions.get(endpoint.path)
    return localFileDescriptions.get(filePath) || 'Descripción no configurada.'
}

function getCommandFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const filePath = path.join(directory, entry.name)
            if (entry.isDirectory()) return getCommandFiles(filePath)
            return entry.isFile() && filePath.endsWith('.js') ? [filePath] : []
        })
        .sort()
}

async function getRegisteredCommands() {
    const groups = new Map()
    const seen = new Set()

    for (const filePath of getCommandFiles(commandsRoot)) {
        try {
            const { default: commandHandler } = await import(pathToFileURL(filePath).href)
            const aliases = Array.isArray(commandHandler?.command)
                ? commandHandler.command
                : typeof commandHandler?.command === 'string' ? [commandHandler.command] : []
            const relativeFile = path.relative(commandsRoot, filePath).split(path.sep).join('/')
            const relativeDirectory = path.relative(commandsRoot, path.dirname(filePath))
            const directoryCategory = relativeDirectory ? relativeDirectory.split(path.sep)[0] : ''

            const availableAliases = aliases.filter(alias => typeof alias === 'string' && !seen.has(alias))
            if (!availableAliases.length) continue
            for (const alias of availableAliases) seen.add(alias)

            if (relativeFile === 'evo_catalog.js') {
                for (const alias of availableAliases) {
                    const endpoint = evoEndpointByCommand.get(alias)
                    const category = endpoint
                        ? evoCategoryNames[endpoint.category] || 'Comandos Evo'
                        : 'Comandos generales'
                    if (!groups.has(category)) groups.set(category, [])
                    groups.get(category).push({
                        aliases: [alias],
                        description: commandDescription(alias, relativeFile)
                    })
                }
                continue
            }

            const endpoint = evoEndpointByCommand.get(availableAliases[0])
            const category = directoryCategory
                ? categoryNames[directoryCategory] || 'Otros'
                : availableAliases.includes('evo')
                    ? 'Comandos generales'
                    : evoCategoryNames[endpoint?.category] || 'Comandos Evo'
            if (!groups.has(category)) groups.set(category, [])
            const commandsByDescription = new Map()
            for (const alias of availableAliases) {
                const description = commandDescription(alias, relativeFile)
                if (!commandsByDescription.has(description)) commandsByDescription.set(description, [])
                commandsByDescription.get(description).push(alias)
            }
            for (const [description, commandAliases] of commandsByDescription) {
                groups.get(category).push({ aliases: commandAliases, description })
            }
        } catch {
            continue
        }
    }

    return groups
}

function formatUptime(seconds) {
    const totalSeconds = Math.floor(seconds)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remainder = totalSeconds % 60
    return [days && `${days}d`, `${hours}h`, `${minutes}m`, `${remainder}s`].filter(Boolean).join(' ')
}

function formatMenu(groups, usedPrefix, m, totalCommands) {
    const user = global.db?.users?.[m.sender] || {}
    const userName = String(m.pushName || user.name || m.sender?.split('@')[0] || 'Usuario')
        .replace(/[\r\n]+/g, ' ')
        .slice(0, 40)
        .trim()
    const role = String(user.role || 'Novato').replace(/[\r\n]+/g, ' ').slice(0, 40).trim()
    const level = Number.isFinite(Number(user.level)) ? Math.max(0, Math.floor(Number(user.level))) : 0
    const commandsUsed = Number.isFinite(Number(user.comandos)) ? Math.max(0, Number(user.comandos)) : 0
    const totalUsers = Object.keys(global.db?.users || {}).length
    const uptime = formatUptime(process.uptime())
    const lines = [
        '╭━━━〔 ✦ CHARLY BOT ✦ 〕━━━╮',
        `│ Hola, ${userName}`,
        `│ Rango: ${role} · Nivel: ${level}`,
        `│ Prefijo: ${usedPrefix} · Comandos: ${totalCommands}`,
        `│ Tus usos: ${commandsUsed} · Usuarios: ${totalUsers}`,
        `│ Activo: ${uptime}`,
        '╰━━━━━━━━━━━━━━━━━━━━━━━━╯',
        '',
        '📚 Lista de comandos',
        ''
    ]

    for (const [category, commands] of groups) {
        lines.push(`╭─ ${categoryIcons[category] || '📂'} ${category.toUpperCase()} ─`)
        for (const { aliases, description } of commands) {
            lines.push(`│ ${aliases.map(alias => `${usedPrefix}${alias}`).join(' / ')}`)
            lines.push(`│   ${description}`)
        }
        lines.push('╰────────────────────────╯', '')
    }

    lines.push(`✦ Usa ${usedPrefix} seguido del comando para ejecutarlo.`)
    return lines.join('\n').trimEnd()
}

var handler = async (m, { conn, usedPrefix }) => {
    const groups = await getRegisteredCommands()
    const commandCount = [...groups.values()].flat().reduce((total, entry) => total + entry.aliases.length, 0)
    const text = formatMenu(groups, usedPrefix, m, commandCount)
    try {
        await conn.sendMessage(m.chat, {
            text,
            contextInfo: {
                externalAdReply: {
                    title: 'CHARLY BOT · GRIMORIO',
                    body: `${commandCount} comandos · ${groups.size} categorías`,
                    mediaType: 1,
                    thumbnailUrl: MENU_IMAGE_URL,
                    sourceUrl: MENU_IMAGE_URL,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
    } catch (error) {
        console.error('[MENU PREVIEW]', error.message)
        await conn.sendMessage(m.chat, { text }, { quoted: m })
    }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'comandos', 'h']

export default handler
