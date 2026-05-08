import axios from 'axios';
import mime from 'mime-types';
import config from '../../config.js';

export default {
    command: ['danbooru', 'danbooru-dl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh gambar atau video dari Danbooru.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Link Danbooru-nya mana Kakak~? Ketik .${msgData.commandName} <url> yaa! (๑>ᴗ<๑)` }, { quoted: m });
        }

        const url = msgData.args[0];
        await msgData.react('⏳');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/danbooru?url=${encodeURIComponent(url)}`);

            if (!data || !data.url) {
                throw new Error('Maafin Ryzumi kak, datanya nggak ketemu atau link-nya rusak.. (╥﹏╥)');
            }

            const mimetype = mime.lookup(data.url) || 'application/octet-stream';
            const isVideo = mimetype.startsWith('video/');
            const isGif = mimetype === 'image/gif';
            
            let caption = `--- *DANBOORU DOWNLOADER* ---\n\n`;
            caption += `🆔 *ID:* ${data.ID}\n`;
            caption += `👤 *Uploader:* ${data.Uploader}\n`;
            caption += `📅 *Date:* ${data.Date}\n`;
            caption += `📦 *Size:* ${data.Size}\n`;
            caption += `🔞 *Rating:* ${data.Rating}\n`;
            caption += `⭐ *Score:* ${data.Score}\n`;
            caption += `💖 *Favorites:* ${data.Favorites}\n`;
            caption += `🔗 *Source:* ${data.Source}\n\n`;
            caption += `Ini dia medianya buat Kakak~! (˶˃ ᵕ ˂˶)`;

            if (isVideo || isGif) {
                await sock.sendMessage(msgData.remoteJid, {
                    video: { url: data.url },
                    caption: caption,
                    mimetype: isGif ? 'video/mp4' : mimetype,
                    gifPlayback: isGif
                }, { quoted: m });
            } else {
                await sock.sendMessage(msgData.remoteJid, {
                    image: { url: data.url },
                    caption: caption,
                    mimetype: mimetype
                }, { quoted: m });
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('Danbooru Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gawat kak! Ryzumi gagal download: ${errMsg}.. (⊙_⊙)` }, { quoted: m });
        }
    }
};
