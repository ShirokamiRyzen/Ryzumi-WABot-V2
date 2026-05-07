import config from '../../config.js';

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

        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (target === botJid) {
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
