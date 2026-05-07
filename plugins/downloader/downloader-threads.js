import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['threads', 'threadsdl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh media (gambar/video) dari Threads.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { 
                text: `Kakak manis~ Kasih link Threads-nya dulu dong buat aku download.. (˶˃ ᵕ ˂˶)` 
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const url = msgData.args[0];
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/threads?url=${encodeURIComponent(url)}`);

            if (!data.success || !data.result) throw new Error('Gagal mengambil data dari Threads-nya kak~ (╥﹏╥)');

            const medias = data.result.media || [];
            if (medias.length === 0) throw new Error('Yaaah, nggak ada media yang bisa aku ambil dari Threads itu kak.. (｡T ω T｡)');

            for (let i = 0; i < medias.length; i++) {
                const item = medias[i];
                const isVideo = item.type === 'video';
                
                let msgCaption = '';
                if (i === 0) {
                    msgCaption = `Ini pesanan Threads kakak @${msgData.senderJid.split('@')[0]}~! (๑>ᴗ<๑)\n\n*Caption:* ${data.result.caption || '-'}`;
                }

                await sock.sendMessage(msgData.remoteJid, {
                    [isVideo ? 'video' : 'image']: { url: item.url },
                    caption: msgCaption.trim(),
                    mentions: i === 0 ? [msgData.senderJid] : [],
                    mimetype: isVideo ? 'video/mp4' : undefined
                }, { quoted: m });
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Threads Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Aduuh gomenasai kak! Ada error pas download Threads: ${errMsg}.. (╥﹏╥)` 
            }, { quoted: m });
        }
    }
};
