import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['ytmp3', 'ytaudio', 'yta'],
    category: 'downloader',
    isRegistered: true,
    limit: 3,
    description: 'Mengunduh audio dari YouTube.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Duhh Kakak lupa ya? Masukkan link YouTube-nya yaa! Contoh: .${msgData.commandName} <url> (˶˃ ᵕ ˂˶)`);
        }

        const videoUrl = msgData.args[0];
        await msgData.react('🕓');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`);

            if (!data || !data.url) {
                throw new Error('Yahhh... Link audionya nggak ketemu di server Ryzumi (╥﹏╥)');
            }

            const { title, author, lengthSeconds, views, uploadDate } = data;
            const safeTitle = (title || 'audio').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);

            const caption = `Ini kak audionya buat Kakak~! @${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +
                `🎵 *Title:* ${title}\n` +
                `👤 *Author:* ${author}\n` +
                `⏳ *Duration:* ${lengthSeconds} sec\n` +
                `👀 *Views:* ${views}\n` +
                `📅 *Uploaded:* ${uploadDate}\n\n`;

            // Kirim file audio sebagai dokumen langsung menggunakan URL
            await sock.sendMessage(msgData.remoteJid, {
                document: { url: data.url },
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                caption: caption,
                mentions: [msgData.senderJid]
            }, { quoted: m });

            await msgData.react('✅');

        } catch (error) {
            console.error('YTMP3 Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Gawat kak! Gagal unduh audio: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
