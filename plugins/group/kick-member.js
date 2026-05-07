import config from '../../config.js';
import { resolveLidToJid } from '../../libs/lid-resolver.js';

export default {
    command: ['kick', 'tendang'],
    category: 'group',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    description: 'Mengeluarkan anggota dari grup',
    async execute(sock, m, msgData) {
        const target = msgData.parseTargetJid();
        
        if (!target) {
            return msgData.reply(config.RYZUMI_MSG_QUOTED || 'Tag atau balas pesan anggota yang ingin dikeluarkan ya kakak~ (๑>ᴗ<๑)');
        }

        // Cek jika target adalah bot itu sendiri (menggunakan JID atau LID)
        const jidToNum = (jid) => jid?.split('@')[0].split(':')[0];
        const botId = sock.user?.id;
        const botLid = sock.user?.lid;
        
        // Terjemahkan target (LID ke JID Nomor) untuk perbandingan yang akurat
        const resolvedTarget = resolveLidToJid(target);
        const normalizedTarget = jidToNum(resolvedTarget);
        const normalizedBot = jidToNum(botId);

        if (target === botId || target === botLid || normalizedTarget === normalizedBot) {
            return msgData.reply('Nooo! Kenapa kakak mau mengeluarkan aku? Aku kan imut~ (╥﹏╥)');
        }

        try {
            // Eksekusi kick menggunakan Baileys
            await sock.groupParticipantsUpdate(msgData.remoteJid, [target], 'remove');
            
            // Berikan respon sukses dengan gaya moe
            const responseText = `S-siap kak! Anggota jahatnya sudah aku keluarkan dari grup~ (˶˃ ᵕ ˂˶)\n\nTarget: @${target.split('@')[0]}`;
            await sock.sendMessage(msgData.remoteJid, { 
                text: responseText, 
                mentions: [target] 
            }, { quoted: m });
            
        } catch (error) {
            console.error('Kick Error:', error);
            await msgData.reply(`G-gagal mengeluarkan dia kak... Maafin aku ya~ (╥﹏╥)\n\nError: ${error.message}`);
        }
    }
};
