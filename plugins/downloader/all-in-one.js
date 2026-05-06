import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['aio', 'aiodl'],
    category: 'downloader',
    isRegistered: true, // Wajib daftar
    limit: 1, // Mengurangi 1 limit per penggunaan
    description: 'Mengunduh media dari berbagai platform sosial media (All-In-One).',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `⚠️ Penggunaan: .${msgData.commandName} <url>` }, { quoted: m });
        }

        const url = msgData.args[0];

        // Minta user menunggu dengan mengirimkan reaksi Jam
        await sock.sendMessage(msgData.remoteJid, { react: { text: '🕓', key: m.key } });

        try {
            const response = await axios.get(`${config.API_RYZUMI}/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
            const data = response.data;

            if (!data || !data.medias || data.medias.length === 0) {
                return sock.sendMessage(msgData.remoteJid, { text: '❌ Media tidak ditemukan atau link tidak valid.' }, { quoted: m });
            }

            const { title, source, author, medias } = data;
            const caption = `*${title || 'Deskripsi tidak ditemukan...'}*\n\n*Sumber:* ${source || 'Unknown'}\n*Pembuat:* ${author?.name || author?.username || 'Unknown'}`.trim();

            for (let i = 0; i < medias.length; i++) {
                const media = medias[i];
                const msgCaption = i === 0 ? caption : ''; // Beri caption hanya pada media pertama

                if (media.type === 'video') {
                    await sock.sendMessage(msgData.remoteJid, {
                        video: { url: media.url },
                        caption: msgCaption,
                        mimetype: 'video/mp4'
                    }, { quoted: m });
                } else if (media.type === 'image') {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: media.url },
                        caption: msgCaption
                    }, { quoted: m });
                } else if (media.type === 'audio') {
                    await sock.sendMessage(msgData.remoteJid, {
                        audio: { url: media.url },
                        mimetype: media.extension === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
                        ptt: false
                    }, { quoted: m });
                }
            }

            // Ubah reaksi menjadi Centang jika berhasil
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('All-In-One Downloader Error:', error);
            
            // Ubah reaksi menjadi Silang jika error
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `❌ Terjadi kesalahan saat mengunduh: ${errMsg}` }, { quoted: m });
        }
    }
};
