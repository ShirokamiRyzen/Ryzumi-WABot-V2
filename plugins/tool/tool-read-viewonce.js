import config from '../../config.js';

export default {
    command: ['read', 'rvo', 'viewonce'],
    category: 'tool',
    isRegistered: true,
    description: 'Melihat pesan media yang dikirim satu kali (view-once).',
    async execute(sock, m, msgData) {
        if (!msgData.isQuoted) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        const { quotedType, quotedMsg } = msgData;
        if (!/image|video/i.test(quotedType)) {
            return sock.sendMessage(msgData.remoteJid, {
                text: 'Aduuh, pesan yang kakak balas itu bukan gambar atau video lhooo~ (๑>ᴗ<๑)'
            }, { quoted: m });
        }

        try {
            // Gunakan helper downloadMedia dari messageAdapter
            const buffer = await msgData.downloadMedia();
            if (!buffer) throw new Error('Gagal mendownload media kak.. (╥﹏╥)');

            const caption = quotedMsg[quotedType]?.caption || '';
            const mediaObj = quotedType.includes('image') ? { image: buffer } : { video: buffer };

            await sock.sendMessage(msgData.remoteJid, {
                ...mediaObj,
                caption: caption
            }, { quoted: m });
        } catch (error) {
            console.error('RVO Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Maafin aku kak, gagal memproses pesan sekali lihatnya: ${error.message}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
