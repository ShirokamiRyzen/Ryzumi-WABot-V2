import axios from 'axios';
import config from '../../config.js';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['animesearch', 'animsearch', 'animesource', 'whatanime'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari judul dan episode anime dari gambar (screenshot)',
    async execute(sock, m, msgData) {
        const argUrl = (msgData.args[0] || '').trim();
        const isDirectUrl = /^https?:\/\/\S+/i.test(argUrl);
        const buffer = isDirectUrl ? null : await msgData.downloadMedia();

        if (!isDirectUrl && !buffer) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari judul anime dari gambar yang mana? (˶˃ ᵕ ˂˶)\n\nKirim atau balas gambar dengan perintah \`.${msgData.commandName}\`, atau sertakan link gambarnya yaa~\nContoh: \`.${msgData.commandName} https://example.com/anime.jpg\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            let imageUrl = argUrl;

            if (!isDirectUrl) {
                const uploaded = await ryzumiCDN(msgData.fileName ? { buffer, originalname: msgData.fileName } : buffer);
                imageUrl = uploaded?.url;
                if (!imageUrl) {
                    throw new Error('Gagal mengunggah gambar ke CDN');
                }
            }

            const url = `${config.API_RYZUMI}/api/weebs/whatanime?url=${encodeURIComponent(imageUrl)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!data || !data.judul) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, sumber anime dari gambar itu nggak ketemu.. Coba pakai screenshot anime yang lebih jelas yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const similarity = data.similarity !== null && data.similarity !== undefined ? Number(data.similarity) : null;
            const lines = [
                `🎌 *ANIME SOURCE FINDER* 🎌`,
                ``,
                `╭─「 *HASIL PENCARIAN* 」`,
                `│ 📺 *Judul:* ${data.judul}`,
                `│ 🎞️ *Episode:* ${data.episode ?? '-'}`,
                `│ 🎯 *Kemiripan:* ${similarity !== null && !Number.isNaN(similarity) ? `${similarity}%` : '-'}`,
                `╰─────────────┈`
            ];

            if (similarity !== null && !Number.isNaN(similarity) && similarity < 85) {
                lines.push(``, `⚠️ _Kemiripan di bawah 85%, hasilnya mungkin kurang akurat yaa kak~_`);
            }

            lines.push(``, `Horeee! Itu tadi hasil pencarian animenya kak~ (๑>ᴗ<๑)`);

            const caption = lines.join('\n');
            let sent = false;

            if (data.videoURL) {
                try {
                    await sock.sendMessage(msgData.remoteJid, {
                        video: { url: data.videoURL },
                        caption
                    }, { quoted: m });
                    sent = true;
                } catch {
                    sent = false;
                }
            }

            if (!sent && data.videoIMG) {
                try {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: data.videoIMG },
                        caption
                    }, { quoted: m });
                    sent = true;
                } catch {
                    sent = false;
                }
            }

            if (!sent) {
                await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });
            }

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Anime Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mencari sumber animenya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
