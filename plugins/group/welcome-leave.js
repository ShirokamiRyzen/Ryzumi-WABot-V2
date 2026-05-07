import Group from '../../databases/orm/Group.js';
import User from '../../databases/orm/User.js';
import config from '../../config.js';
import { resolveLidToJid } from '../../libs/lid-resolver.js';

export default {
    category: 'group',
    description: 'Menangani pesan selamat datang dan selamat tinggal',
    async onParticipantsUpdate(sock, { id, participants, action }) {
        try {
            const group = await Group.findOne({ where: { jid: id } });
            if (!group || !group.is_welcome) return;

            const metadata = await sock.groupMetadata(id);
            
            for (const part of participants) {
                const participant = typeof part === 'string' ? part : (part.id || part.jid);
                if (!participant) continue;
                
                const resolvedJid = resolveLidToJid(participant);

                let user = await User.findOne({ where: { jid: resolvedJid } });
                const username = user?.name || resolvedJid.split('@')[0];
                const memberCount = metadata.participants.length;
            
                let ppUrl;
                try {
                    ppUrl = await sock.profilePictureUrl(resolvedJid, 'image');
                } catch {
                    ppUrl = 'https://s3.ryzumi.net/administrator/ryzumi-perm/bot-whatsapp/default_pp.jpg';
                }

                if (action === 'add') {
                    const bg = 'https://s3.ryzumi.net/administrator/ryzumi-perm/bot-whatsapp/welcome.jpg';
                    const apiUrl = `${config.API_RYZUMI}/api/image/welcome?username=${encodeURIComponent(username)}&group=${encodeURIComponent(metadata.subject)}&avatar=${encodeURIComponent(ppUrl)}&bg=${encodeURIComponent(bg)}&member=${memberCount}`;
                    
                    await sock.sendMessage(id, {
                        image: { url: apiUrl },
                        caption: `Selamat datang @${resolvedJid.split('@')[0]} di ${metadata.subject}`
                    }, { mentions: [resolvedJid] });

                } else if (action === 'remove') {
                    const bg = 'https://s3.ryzumi.net/administrator/ryzumi-perm/bot-whatsapp/goodbye.jpg';
                    const apiUrl = `${config.API_RYZUMI}/api/image/leave?username=${encodeURIComponent(username)}&group=${encodeURIComponent(metadata.subject)}&avatar=${encodeURIComponent(ppUrl)}&bg=${encodeURIComponent(bg)}&member=${memberCount}`;

                    await sock.sendMessage(id, {
                        image: { url: apiUrl },
                        caption: `Selamat tinggal @${resolvedJid.split('@')[0]}`
                    }, { mentions: [resolvedJid] });
                }
            }
        } catch (error) {
            console.error('Welcome-Leave Error:', error);
            const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
            await sock.sendMessage(ownerJid, { text: `[CRITICAL ERROR] Welcome-Leave:\n\n${error.message}\n\nStack:\n${error.stack}` });
        }
    }
};
