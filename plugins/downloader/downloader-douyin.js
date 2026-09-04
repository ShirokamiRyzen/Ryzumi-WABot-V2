// Don't delete this credit!!!
// Script by ShirokamiRyzen

import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['douyin', 'douyindl', 'dydl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh video atau foto dari Douyin dengan resolusi tertinggi.',
    async execute(sock, m, msgData) {
        const { args, commandName, remoteJid, reply, react } = msgData;

        if (args.length === 0) {
            return reply(`Kakak lupa kasih link Douyin-nya yaa? Contohnya gini:\n.${commandName} https://www.douyin.com/video/... (˶˃ ᵕ ˂˶)`);
        }

        const url = args[0];
        await react('⏳');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/douyin?url=${encodeURIComponent(url)}`);

            if ((!data.status && !data.success) || !data.result) {
                throw new Error(data.errors || 'Gagal mengambil data video/foto Douyin kak~ (╥﹏╥)');
            }

            const result = data.result;
            const media = result.media || {};
            const title = result.title || result.caption || 'Tanpa Judul';

            // Jika berupa postingan foto/gambar (slideshow)
            if (media.images && media.images.length > 0) {
                for (let i = 0; i < media.images.length; i++) {
                    const caption = i === 0 ? `Ini foto Douyin-nya buat kakak~ (๑>ᴗ<๑)\n\n*Judul:* ${title}` : '';
                    await sock.sendMessage(remoteJid, {
                        image: { url: media.images[i].url },
                        caption
                    }, { quoted: m });
                }

                // Kirim audio jika tersedia
                if (media.audio && media.audio.length > 0 && media.audio[0]?.url) {
                    await sock.sendMessage(remoteJid, {
                        audio: { url: media.audio[0].url },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, { quoted: m });
                }
            } else {
                // Selalu utamakan mengambil resolusi video tertinggi (HD)
                const videos = media.videos || [];
                const bestVideo = videos.find(v => v.quality === 'hd') || videos[0];

                if (!bestVideo || !bestVideo.url) {
                    throw new Error('Maafin aku kak, video Douyin dengan resolusi yang diminta tidak ditemukan.. (╥﹏╥)');
                }

                const qualityTag = bestVideo.quality ? bestVideo.quality.toUpperCase() : 'HD';
                const caption = `Ini video Douyin-nya buat kakak~ (˶˃ ᵕ ˂˶)\n\n*Judul:* ${title}\n*Kualitas:* ${qualityTag}\n*Engine:* ${result.engine || 'Douyin Direct'}`;

                await sock.sendMessage(remoteJid, {
                    video: { url: bestVideo.url },
                    caption,
                    mimetype: 'video/mp4'
                }, { quoted: m });
            }

            await react('✅');

        } catch (error) {
            console.error('Douyin Downloader Error:', error);
            await react('❌');
            const errMsg = error.response?.data?.errors || error.response?.data?.message || error.message;
            await reply(`Uwaaa gawat! Ada error pas download Douyin: ${errMsg}.. (｡T ω T｡)`);
        }
    }
};
