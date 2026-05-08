import User from '../../databases/orm/User.js';
import config from '../../config.js';

export default {
    command: ['addprem', 'addpremium'],
    category: 'owner',
    isOwner: true,
    description: 'Menambahkan status premium ke pengguna (Hanya Owner).',
    async execute(sock, m, msgData, user) {
        const targetJid = msgData.parseTargetJid();
        if (!targetJid) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        try {
            const [targetUser] = await User.findOrCreate({ 
                where: { jid: targetJid },
                defaults: { is_registered: false }
            });

            if (targetUser.is_premium) {
                return sock.sendMessage(msgData.remoteJid, { 
                    text: `Umm... sepertinya @${targetJid.split('@')[0]} memang sudah jadi User Premium kok kak~ (´･ᴗ･ \` )`,
                    mentions: [targetJid]
                }, { quoted: m });
            }

            await targetUser.update({ is_premium: true });
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Horeee~! Berhasil! Sekarang @${targetJid.split('@')[0]} sudah resmi jadi User Premium! Senangnyaa~ (๑>ᴗ<๑)`,
                mentions: [targetJid]
            }, { quoted: m });

        } catch (error) {
            console.error('Add Premium Error:', error);
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Uwaaa gawat! Gagal nambahin status premium: ${error.message}.. (╥﹏╥)` 
            }, { quoted: m });
        }
    }
};
