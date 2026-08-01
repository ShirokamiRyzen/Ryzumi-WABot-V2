import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['pinsearch', 'pinterestsearch', 'pins'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari gambar di Pinterest',
    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ');

        if (!query) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari gambar apa di Pinterest? Kasih tahu Ryzumi yaa~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} Nao Tomori\``
            }, { quoted: m });
        }

        // Kalau isinya link, arahin ke downloader aja kak~ (๑>ᴗ<๑)
        if (query.includes('pinterest.com') || query.includes('pin.it')) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kalau kakak punya link Pinterest-nya, pakai perintah \`.pin\` aja yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/search/pinterest?query=${encodeURIComponent(query)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!Array.isArray(data) || data.length < 1) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, gambar Pinterest yang kakak cari nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            // Acak dan ambil maksimal 5 hasil aja biar nggak berat~ (˶˃ ᵕ ˂˶)
            const results = data.sort(() => Math.random() - 0.5).slice(0, Math.min(5, data.length));
            const medias = [];

            for (const result of results) {
                try {
                    const response = await axios.get(result.directLink, {
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                            'Referer': result.directLink
                        }
                    });
                    medias.push({
                        image: Buffer.from(response.data),
                        caption: `📌 *Pinterest Search*\n*Pencarian:* ${query}\n🔗 *Link:* ${result.link || '-'}`
                    });
                } catch (err) {
                    console.error('Failed to process one Pinterest image:', err.message);
                }
            }

            if (medias.length === 0) {
                throw new Error('Gagal memproses semua gambar Pinterest.. (╥﹏╥)');
            }

            await msgData.sendAlbum(medias);

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Pinterest Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal cari gambar Pinterest-nya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};

