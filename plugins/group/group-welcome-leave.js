import Group from '../../databases/orm/Group.js';
import User from '../../databases/orm/User.js';
import config from '../../config.js';
import { resolveLidToJid } from '../../libs/lid-resolver.js';

export default {
    category: 'group',
    description: 'Menangani pesan selamat datang dan selamat tinggal dengan gaya Moe (˶˃ ᵕ ˂˶)',
    async onParticipantsUpdate(sock, { id, participants, action }) {
        try {
            const group = await Group.findOne({ where: { jid: id } });
            if (!group || !group.is_welcome) return;

            const metadata = await sock.groupMetadata(id);

            for (const part of participants) {
                const participant = typeof part === 'string' ? part : (part.id || part.jid);
                if (!participant) continue;

                let resolvedJid = resolveLidToJid(participant);

                // Jika masih LID, coba cari di metadata grup untuk mendapatkan JID asli (nomor HP)
                // Ini membantu jika Baileys belum sempat sinkronisasi mapping LID ke disk
                if (resolvedJid.endsWith('@lid')) {
                    const groupParticipant = metadata.participants.find(p => p.id === resolvedJid || p.lid === resolvedJid || p.id?.split('@')[0] === resolvedJid.split('@')[0]);
                    if (groupParticipant && groupParticipant.id && !groupParticipant.id.endsWith('@lid')) {
                        resolvedJid = groupParticipant.id;
                    }
                }

                const user = await User.findOne({ where: { jid: resolvedJid } });
                // Prioritas username: Nama Database > Pushname dari event (jika ada) > Nomor Telepon > LID
                const pushname = typeof part === 'object' ? (part.pushname || part.notify) : null;
                const username = user?.name || pushname || resolvedJid.split('@')[0];
                const memberCount = metadata.participants.length;

                // Ambil PP dengan fallback ke config
                let ppUrl;
                try {
                    ppUrl = await sock.profilePictureUrl(resolvedJid, 'image');
                } catch {
                    ppUrl = config.RYZUMI_DEFAULT_PP;
                }

                // Gunakan banner utama sebagai background
                const bg_welcome = config.RYZUMI_WELCOME_BANNER;
                const bg_leave = config.RYZUMI_LEAVE_BANNER;

                if (action === 'add') {
                    const apiUrl = `${config.API_RYZUMI}/api/image/welcome?username=${encodeURIComponent(username)}&group=${encodeURIComponent(metadata.subject)}&avatar=${encodeURIComponent(ppUrl)}&bg=${encodeURIComponent(bg_welcome)}&member=${memberCount}`;

                    const welcomeText = `Uwaaa! Selamat datang @${resolvedJid.split('@')[0]} di grup *${metadata.subject}*! (˶˃ ᵕ ˂˶)\n\n` +
                        `Semoga kakak betah main di sini bareng kita semua yaa! Jangan lupa baca aturan grupnya kakak manis~ (๑>ᴗ<๑)`;

                    await sock.sendMessage(id, {
                        image: { url: apiUrl },
                        caption: welcomeText,
                        mentions: [resolvedJid]
                    });

                } else if (action === 'remove') {
                    const apiUrl = `${config.API_RYZUMI}/api/image/leave?username=${encodeURIComponent(username)}&group=${encodeURIComponent(metadata.subject)}&avatar=${encodeURIComponent(ppUrl)}&bg=${encodeURIComponent(bg_leave)}&member=${memberCount}`;

                    const leaveText = `Yahhh... Sayang sekali, Kakak @${resolvedJid.split('@')[0]} sudah meninggalkan grup.. (｡T ω T｡)\n\n` +
                        `Selamat jalan ya kak, terima kasih sudah mampir! Ryzumi bakal kangen~ (╥﹏╥)`;

                    await sock.sendMessage(id, {
                        image: { url: apiUrl },
                        caption: leaveText,
                        mentions: [resolvedJid]
                    });
                }
            }
        } catch (error) {
            console.error('Welcome-Leave Error:', error);
            // Hanya kirim log ke owner jika terjadi error fatal
            const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
            await sock.sendMessage(ownerJid, { text: `[CRITICAL ERROR] Welcome-Leave:\n\n${error.message}` }).catch(() => { });
        }
    }
};
