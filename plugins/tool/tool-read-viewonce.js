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
        if (!/image|video|audio/i.test(quotedType)) {
            return sock.sendMessage(msgData.remoteJid, {
                text: 'Aduuh, pesan yang kakak balas itu bukan gambar, video, atau audio lhooo~ (๑>ᴗ<๑)'
            }, { quoted: m });
        }

        const mediaContent = quotedMsg?.[quotedType];
        if (!mediaContent?.url && !mediaContent?.directPath) {
            return sock.sendMessage(msgData.remoteJid, {
                text: 'Maafin aku kak, data media pesan sekali lihatnya sudah disembunyikan WhatsApp dan tidak ada di cache bot (kemungkinan dikirim sebelum bot aktif).. coba kirim ulang pesannya ya kak! (╥﹏╥)'
            }, { quoted: m });
        }

        try {
            // Gunakan helper downloadMedia dari messageAdapter
            const buffer = await msgData.downloadMedia();
            if (!buffer) throw new Error('Gagal mendownload media kak.. (╥﹏╥)');

            const caption = mediaContent.caption || '';
            let payload;
            if (quotedType.includes('image')) {
                payload = { image: buffer, caption };
            } else if (quotedType.includes('video')) {
                payload = { video: buffer, caption };
            } else {
                payload = {
                    audio: buffer,
                    mimetype: mediaContent.mimetype || 'audio/ogg; codecs=opus',
                    ptt: !!mediaContent.ptt
                };
            }

            await sock.sendMessage(msgData.remoteJid, payload, { quoted: m });
        } catch (error) {
            console.error('RVO Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Maafin aku kak, gagal memproses pesan sekali lihatnya: ${error.message}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
