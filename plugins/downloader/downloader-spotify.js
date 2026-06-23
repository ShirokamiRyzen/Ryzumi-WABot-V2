import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['spotify', 'spotdl', 'spotifydl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh lagu dari Spotify.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Duhh Kakak lupa ya? Masukkan link Spotify-nya yaa! Contoh: .${msgData.commandName} <url> (˶˃ ᵕ ˂˶)`);
        }

        const spotifyUrl = msgData.args[0];
        
        // Validasi link Spotify sederhana
        if (!/spotify\.com/i.test(spotifyUrl)) {
            return msgData.reply('Umm... Itu sepertinya bukan link Spotify yang valid deh, Kak. Coba periksa lagi yaa~ (╥﹏╥)');
        }

        await msgData.react('⏳');

        try {
            const apiUrl = `${config.API_RYZUMI}/api/downloader/spotify?url=${encodeURIComponent(spotifyUrl)}`;
            const { data } = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                }
            });

            if (!data || !data.success || !data.link) {
                throw new Error(data.message || 'Yahhh... Link download Spotify-nya nggak ketemu di server Ryzumi (╥﹏╥)');
            }

            const { metadata, link, coverUrl } = data;
            const title = metadata?.title || 'Spotify Audio';
            const artists = metadata?.artists || 'Unknown Artist';
            const album = metadata?.album || 'Unknown Album';
            const releaseDate = metadata?.releaseDate || '-';
            const cover = metadata?.cover || coverUrl;

            const safeTitle = title.replace(/[\\/:*?"<>|]/g, '').slice(0, 50);

            const caption = `--- *SPOTIFY DOWNLOADER* ---\n\n` +
                `🎵 *Judul:* ${title}\n` +
                `👤 *Artis:* ${artists}\n` +
                `💿 *Album:* ${album}\n` +
                `📅 *Rilis:* ${releaseDate}\n\n` +
                `Sabar ya kak, Ryzumi sedang mengirimkan audionya... ✨ (˶˃ ᵕ ˂˶)`;

            // Kirim cover album beserta informasi metadata lagu
            if (cover) {
                await sock.sendMessage(msgData.remoteJid, {
                    image: { url: cover },
                    caption: caption
                }, { quoted: m });
            } else {
                await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });
            }

            // Kirim file audio sebagai dokumen agar kualitasnya tetap terjaga dan nama filenya rapi
            await sock.sendMessage(msgData.remoteJid, {
                document: { url: link },
                mimetype: 'audio/mpeg',
                fileName: `${artists} - ${safeTitle}.mp3`
            }, { quoted: m });

            await msgData.react('✅');

        } catch (error) {
            console.error('Spotify Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Gawat kak! Ryzumi gagal download dari Spotify: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
