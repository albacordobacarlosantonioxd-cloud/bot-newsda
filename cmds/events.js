import fetch from 'node-fetch';
import chalk from 'chalk';

export default async (client) => {
    // Evento: Cambio en los participantes (Entradas, Salidas, Promociones)
    client.ev.on('group-participants.update', async (anu) => {
        try {
            const metadata = await client.groupMetadata(anu.id).catch(() => null);
            if (!metadata) return;

            const memberCount = metadata.participants.length;

            for (const p of anu.participants) {
                const jid = p;
                const phone = jid.split('@')[0];
                
                // Intentar obtener foto de perfil, si no, una por defecto
                const pp = await client.profilePictureUrl(jid, 'image').catch(() => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg');

                // Lógica de Bienvenida (ADD)
                if (anu.action === 'add') {
                    const caption = `╭┈──̇─̇─̇────̇─̇─̇──◯◝
┊「 *Bienvenido (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)* 」
┊︶︶︶︶︶︶︶︶︶︶︶
┊  *Nombre ›* @${phone}
┊  *Grupo ›* ${metadata.subject}
┊┈─────̇─̇─̇─────◯◝
┊➤ *Usa /menu para ver los comandos.*
┊➤ *Ahora somos ${memberCount} miembros.*
┊ ︿︿︿︿︿︿︿︿︿︿︿
╰─────────────────╯`;
                    await client.sendMessage(anu.id, { image: { url: pp }, caption, mentions: [jid] });
                }

                // Lógica de Despedida (REMOVE/LEAVE)
                if (anu.action === 'remove' || anu.action === 'leave') {
                    const caption = `╭┈──̇─̇─̇────̇─̇─̇──◯◝
┊「 *Hasta pronto (⁠╥⁠﹏⁠╥⁠)* 」
┊︶︶︶︶︶︶︶︶︶︶︶
┊  *Nombre ›* @${phone}
┊  *Grupo ›* ${metadata.subject}
┊┈─────̇─̇─̇─────◯◝
┊➤ *Ojalá que vuelva pronto.*
┊➤ *Ahora somos ${memberCount} miembros.*
┊ ︿︿︿︿︿︿︿︿︿︿︿
╰─────────────────╯`;
                    await client.sendMessage(anu.id, { image: { url: pp }, caption, mentions: [jid] });
                }
            }
        } catch (err) {
            // Log minimalista en gris como te gusta
            console.log(chalk.gray(`[ EVENT ERROR ] → ${err.message}`));
        }
    });

    // Evento: Alertas de cambios en el grupo (Nombre, Foto, etc.)
    client.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.messageStubType) return;
        
        const id = m.key.remoteJid;
        const actor = m.key?.participant || m.participant || id;
        const phone = actor.split('@')[0];

        // Mapeo de tipos de mensajes de sistema
        const stubTypes = {
            21: `cambió el nombre del grupo a: *${m.messageStubParameters?.[0]}*`,
            22: `cambió el icono del grupo.`,
            23: `restableció el enlace del grupo.`,
            24: `cambió la descripción del grupo.`,
            25: `cambió los ajustes del grupo (edición de info).`,
            26: `cerró/abrió el chat del grupo.`
        };

        if (stubTypes[m.messageStubType]) {
            await client.sendMessage(id, { 
                text: `「✎」 @${phone} ${stubTypes[m.messageStubType]}`, 
                mentions: [actor] 
            });
        }
    });
};
