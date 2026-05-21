var handler = async (m, { conn, usedPrefix }) => {
    let imageMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png' 
    
    let menu = `┏━━━━━━━━━━━━━━━━━━━━┓
┃  🏮 *CHARLY-BOT MAESTRO V2* 🏮
┗━━━━━━━━━━━━━━━━━━━━┛

👤 *Hᴏʟᴀ:* @${m.sender.split('@')[0]}
⚡ *Dᴇᴠ:* Charly Developer
📡 *Sᴛᴀᴛᴜs:* Online 🟢
📅 *Fᴇᴄʜᴀ:* ${new Date().toLocaleDateString()}

━━━━━━━┫ *I.A. COMMANDS* ┣━━━━━━━
🤖 *${usedPrefix}ia*
└─ _Consulta a Gemini AI_
🧠 *${usedPrefix}claude*
└─ _Consulta a Claude AI_
💬 *${usedPrefix}gpt*
└─ _Consulta a ChatGPT_
🎨 *${usedPrefix}nb*
└─ _Generar imágenes artísticas_
📸 *${usedPrefix}brat*
└─ _Sticker con texto estilo Brat_

━━━━━━━┫ *DOWNLOADERS* ┣━━━━━━━
🎵 *${usedPrefix}audio*
└─ _Descargar música de YouTube_
🎥 *${usedPrefix}video*
└─ _Descargar video de YouTube_
📸 *${usedPrefix}ig*
└─ _Contenido de Instagram_
👥 *${usedPrefix}fb*
└─ _Videos de Facebook_
🎵 *${usedPrefix}tk*
└─ _Videos de TikTok sin marca_
📦 *${usedPrefix}mf*
└─ _Archivos de MediaFire_

━━━━━━━┫ *TOOLS & ADMIN* ┣━━━━━━━
✨ *${usedPrefix}hd*
└─ _Mejorar calidad de imagen_
🌎 *${usedPrefix}tr*
└─ _Traductor de idiomas_
🔍 *${usedPrefix}yts*
└─ _Buscador de YouTube_
🐙 *${usedPrefix}ghstalk*
└─ _Información de GitHub_
📣 *${usedPrefix}tagall*
└─ _Mencionar a todos_
🔓 *${usedPrefix}open*
└─ _Abrir el grupo_
🔒 *${usedPrefix}close*
└─ _Cerrar el grupo_
🗑️ *${usedPrefix}del*
└─ _Eliminar mensajes_
🚪 *${usedPrefix}kick*
└─ _Expulsar usuario_
👑 *${usedPrefix}promote*
└─ _Dar administrador_
👤 *${usedPrefix}demote*
└─ _Quitar administrador_
🔗 *${usedPrefix}link*
└─ _Enlace del grupo_
🔄 *${usedPrefix}revoke*
└─ _Renovar enlace_
🔞 *${usedPrefix}nsfw* <on/off>
└─ _Control de contenido Hot_

━━━━━━━┫ *REACTIONS SFW* ┣━━━━━━━
🎭 *${usedPrefix}hug* -> _Dar un abrazo_
🎭 *${usedPrefix}pat* -> _Dar una caricia_
🎭 *${usedPrefix}wink* -> _Guiñar un ojo_
🎭 *${usedPrefix}slap* -> _Dar una bofetada_
🎭 *${usedPrefix}kiss* -> _Dar un beso_
🎭 *${usedPrefix}dance* -> _Ponerse a bailar_
🎭 *${usedPrefix}cuddle* -> _Acurrucarse_
🎭 *${usedPrefix}smile* -> _Sonreír_
🎭 *${usedPrefix}wave* -> _Saludar_
🎭 *${usedPrefix}blush* -> _Sonrojarse_
🎭 *${usedPrefix}smug* -> _Presumir/Burlarse_
🎭 *${usedPrefix}bonk* -> _Dar un golpe suave_
🎭 *${usedPrefix}clap* -> _Aplaudir_
🎭 *${usedPrefix}cringe* -> _Sentir vergüenza_
🎭 *${usedPrefix}happy* -> _Estar feliz_
🎭 *${usedPrefix}kill* -> _Matar (Rol)_
🎭 *${usedPrefix}love* -> _Dar amor_
🎭 *${usedPrefix}sad* -> _Estar triste_
🎭 *${usedPrefix}scared* -> _Tener miedo_
🎭 *${usedPrefix}shy* -> _Estar tímido_
🎭 *${usedPrefix}sleep* -> _Irse a dormir_
🎭 *${usedPrefix}think* -> _Pensar algo_
🎭 *${usedPrefix}walk* -> _Caminar_
🎭 *${usedPrefix}poke* -> _Picar/Molestar_
🎭 *${usedPrefix}bully* -> _Hacer bullying_
🎭 *${usedPrefix}bite* -> _Morder_
🎭 *${usedPrefix}highfive* -> _Chocar esos cinco_
🎭 *${usedPrefix}handhold* -> _Tomar de la mano_
🎭 *${usedPrefix}lick* -> _Lamer_
🎭 *${usedPrefix}kick* -> _Dar una patada_
🎭 *${usedPrefix}kisscheek* -> _Beso en la mejilla_
🎭 *${usedPrefix}sing* -> _Ponerse a cantar_
🎭 *${usedPrefix}tickle* -> _Hacer cosquillas_
🎭 *${usedPrefix}scream* -> _Gritar fuerte_
🎭 *${usedPrefix}push* -> _Empujar_
🎭 *${usedPrefix}nope* -> _Decir que no_
🎭 *${usedPrefix}jump* -> _Saltar_
🎭 *${usedPrefix}gaming* -> _Ponerse a jugar_
🎭 *${usedPrefix}draw* -> _Ponerse a dibujar_
🎭 *${usedPrefix}call* -> _Llamar a alguien_
🎭 *${usedPrefix}laugh* -> _Reírse fuerte_
🎭 *${usedPrefix}pout* -> _Hacer puchero_
🎭 *${usedPrefix}punch* -> _Dar un puñetazo_
🎭 *${usedPrefix}run* -> _Salir corriendo_
🎭 *${usedPrefix}seduce* -> _Seducir_
🎭 *${usedPrefix}smoke* -> _Fumar_
🎭 *${usedPrefix}spit* -> _Escupir_
🎭 *${usedPrefix}step* -> _Pisar a alguien_
🎭 *${usedPrefix}peek* -> _Echar un vistazo_
🎭 *${usedPrefix}comfort* -> _Consolar_
🎭 *${usedPrefix}thinkhard* -> _Pensar mucho_
🎭 *${usedPrefix}curious* -> _Sentir curiosidad_
🎭 *${usedPrefix}sniff* -> _Olfatear_
🎭 *${usedPrefix}stare* -> _Mirar fijamente_
🎭 *${usedPrefix}trip* -> _Tropezarse_
🎭 *${usedPrefix}blowkiss* -> _Enviar un beso_
🎭 *${usedPrefix}snuggle* -> _Acurrucarse bien_
🎭 *${usedPrefix}angry* -> _Estar enojado_
🎭 *${usedPrefix}bleh* -> _Sacar la lengua_
🎭 *${usedPrefix}bored* -> _Estar aburrido_
🎭 *${usedPrefix}coffee* -> _Tomar café_
🎭 *${usedPrefix}dramatic* -> _Hacer drama_
🎭 *${usedPrefix}drunk* -> _Estar borracho_
🎭 *${usedPrefix}cold* -> _Tener frío_

━━━━━━━┫ *INTERACTIONS NSFW* ┣━━━━━━━
🔞 *${usedPrefix}spank* -> _Dar nalgadas_
🔞 *${usedPrefix}undress* -> _Desvestir_
🔞 *${usedPrefix}yuri* -> _Acción lésbica_
🔞 *${usedPrefix}sixnine* -> _Hacer un 69_
🔞 *${usedPrefix}anal* -> _Sexo anal_
🔞 *${usedPrefix}fuck* -> _Follar_
🔞 *${usedPrefix}cummouth* -> _Correrse en la boca_
🔞 *${usedPrefix}suckboobs* -> _Chupar pechos_
🔞 *${usedPrefix}cumshot* -> _Correrse_
🔞 *${usedPrefix}lickpussy* -> _Lamer vagina_
🔞 *${usedPrefix}lickdick* -> _Lamer pene_
🔞 *${usedPrefix}lickass* -> _Lamer el trasero_
🔞 *${usedPrefix}handjob* -> _Paja con la mano_
🔞 *${usedPrefix}grope* -> _Manosear_
🔞 *${usedPrefix}cum* -> _Venirse_
🔞 *${usedPrefix}grabboobs* -> _Agarrar pechos_
🔞 *${usedPrefix}blowjob* -> _Hacer una mamada_
🔞 *${usedPrefix}boobjob* -> _Rusa con pechos_
🔞 *${usedPrefix}fap* -> _Masturbarse_
🔞 *${usedPrefix}footjob* -> _Paja con pies_
🔞 *${usedPrefix}fingering* -> _Dedeo_
🔞 *${usedPrefix}creampie* -> _Correrse dentro_
🔞 *${usedPrefix}facesitting* -> _Sentarse en la cara_
🔞 *${usedPrefix}futanari* -> _Contenido Futa_
🔞 *${usedPrefix}pegging* -> _Hacer pegging_
🔞 *${usedPrefix}bondage* -> _Ataduras BDSM_
🔞 *${usedPrefix}deepthroat* -> _Garganta profunda_
🔞 *${usedPrefix}thighjob* -> _Paja con muslos_
🔞 *${usedPrefix}yaoi* -> _Acción gay_
🔞 *${usedPrefix}bukkake* -> _Hacer bukkake_
🔞 *${usedPrefix}orgy* -> _Hacer una orgía_
🔞 *${usedPrefix}squirting* -> _Hacer squirting_

━━━━━━━━━━━━━━━━━━━━━
⚡ *𝘽𝙮: Charly Developer*
📡 *Charly Developers x Zona Developers*
━━━━━━━━━━━━━━━━━━━━━`

    await conn.sendMessage(m.chat, { 
        image: { url: imageMenu }, 
        caption: menu,
        mentions: [m.sender]
    }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'comandos', 'h']

export default handler
