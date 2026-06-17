import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['ytmp4', 'ytvideo', 'ytv'],
    category: 'downloader',
    isRegistered: true,
    limit: 5,
    description: 'Mengunduh video dari YouTube dengan pilihan resolusi.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Umm... Kakak lupa masukkan link YouTube-nya ya? Ketik .${msgData.commandName} <url> [resolusi] yaa~ (˶˃ ᵕ ˂˶)`);
        }

        const videoUrl = msgData.args[0];
        let resolution = msgData.args[1] || '480';

        await msgData.react('🕓');

        try {
            const apiUrl = `${config.API_RYZUMI}/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${resolution}`;
            // console.log('Ryzumi API Request:', apiUrl);

            const { data } = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                }
            });

            if (!data || !data.url || data.url === 'Unknown Download URL' || !data.url.startsWith('http')) {
                throw new Error('Yahhh... Link videonya nggak ketemu atau resolusi ini nggak tersedia di server Ryzumi (╥﹏╥)');
            }

            const safeTitle = (data.title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);

            const caption = `Ini videonya buat Kakak~! @${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +
                `🎥 *Title:* ${data.title}\n` +
                `👤 *Author:* ${data.author}\n` +
                `⏳ *Duration:* ${data.lengthSeconds}\n` +
                `📺 *Quality:* ${data.quality || resolution}\n` +
                `👀 *Views:* ${data.views}\n` +
                `📅 *Uploaded:* ${data.uploadDate}\n\n`;

            await sock.sendMessage(msgData.remoteJid, {
                video: { url: data.url },
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`,
                caption: caption,
                mentions: [msgData.senderJid]
            }, { quoted: m });

            await msgData.react('✅');

        } catch (error) {
            console.error('YTMP4 Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Uwaaa gawat! Ryzumi gagal unduh videonya: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
