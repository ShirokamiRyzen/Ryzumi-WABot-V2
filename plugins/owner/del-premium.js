import User from '../../databases/orm/User.js';
import config from '../../config.js';

export default {
    command: ['delprem', 'delpremium'],
    category: 'owner',
    isOwner: true,
    description: 'Menghapus status premium dari pengguna (Hanya Owner).',
    async execute(sock, m, msgData, user) {
        const targetJid = msgData.parseTargetJid();
        if (!targetJid) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        try {
            const targetUser = await User.findOne({ where: { jid: targetJid } });
            if (!targetUser || !targetUser.is_premium) {
                return sock.sendMessage(msgData.remoteJid, { 
                    text: `Umm... @${targetJid.split('@')[0]} memang bukan User Premium kok kak~ (´･ᴗ･ \` )`,
                    mentions: [targetJid]
                }, { quoted: m });
            }

            await targetUser.update({ is_premium: false });
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Yahhh... Sayang sekali, sekarang status premium @${targetJid.split('@')[0]} sudah dihapus kak.. (｡T ω T｡)`,
                mentions: [targetJid]
            }, { quoted: m });

        } catch (error) {
            console.error('Del Premium Error:', error);
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Uwaaa gawat! Gagal menghapus status premium: ${error.message}.. (╥﹏╥)` 
            }, { quoted: m });
        }
    }
};
