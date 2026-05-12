export default {
    command: ['delprem', 'delpremium'],
    category: 'owner',
    isOwner: true,
    description: 'Menghapus status premium dari pengguna (Hanya Owner).',
    async execute(sock, m, msgData, user) {
        const { config, db, remoteJid } = msgData;
        const targetJid = msgData.parseTargetJid();
        
        if (!targetJid) {
            return msgData.reply(config.RYZUMI_MSG_QUOTED);
        }

        try {
            const targetUser = await db.User.findOne({ where: { jid: targetJid } });
            if (!targetUser || !targetUser.is_premium) {
                return sock.sendMessage(remoteJid, { 
                    text: `Umm... @${targetJid.split('@')[0]} memang bukan User Premium kok kak~ (´･ᴗ･ \` )`,
                    mentions: [targetJid]
                }, { quoted: m });
            }

            await targetUser.update({ is_premium: false });
            await sock.sendMessage(remoteJid, { 
                text: `Yahhh... Sayang sekali, sekarang status premium @${targetJid.split('@')[0]} sudah dihapus kak.. (｡T ω T｡)`,
                mentions: [targetJid]
            }, { quoted: m });

        } catch (error) {
            console.error('Del Premium Error:', error);
            await msgData.reply(`Uwaaa gawat! Gagal menghapus status premium: ${error.message}.. (╥﹏╥)`);
        }
    }
};
