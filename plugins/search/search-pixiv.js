import axios from 'axios';
import sharp from 'sharp';
import config from '../../config.js';

export default {
    command: ['pixivsearch', 'pixivs'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari gambar di Pixiv',
    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ');

        if (!query) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari gambar apa di Pixiv? Kasih tahu Ryzumi yaa~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} Nao Tomori\``
            }, { quoted: m });
        }

        if (query.includes('pixiv.net')) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kalau kakak mau download dari link, pakai perintah \`.pixiv\` aja yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/search/pixiv?query=${encodeURIComponent(query)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!data || !data.Media || !Array.isArray(data.Media) || data.Media.length < 1) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, gambar Pixiv yang kakak cari nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            const images = data.Media;
            const pageLink = `https://www.pixiv.net/search.php?s_mode=s_tag&word=${encodeURIComponent(query)}`;

            const caption = data.caption || 'Pixiv Search Result';
            const artist = data.artist || 'Unknown';
            const tags = data.tags ? data.tags.join(', ') : '-';

            const medias = [];

            for (const imageUrl of images) {
                try {
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    let buffer = Buffer.from(response.data);

                    const threshold = 12 * 1024 * 1024;
                    if (buffer.length > threshold) {
                        buffer = await sharp(buffer)
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    }

                    medias.push({
                        image: buffer,
                        caption: `🎨 *Pixiv Search Result*\n*Artist:* ${artist}\n*Tags:* ${tags}\n🔗 *Link:* ${pageLink}\n\n${caption}`
                    });
                } catch (err) {
                    console.error('Failed to process one Pixiv image:', err.message);
                }
            }

            if (medias.length === 0) {
                throw new Error('Gagal memproses semua gambar Pixiv.. (╥﹏╥)');
            }

            await msgData.sendAlbum(medias);

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Pixiv Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal cari gambar Pixiv-nya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};

