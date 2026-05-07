// Don't delete this credit!!!
// Script by ShirokamiRyzen

import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['facebook', 'fb', 'fbdl', 'fbdownload'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh video atau gambar dari Facebook.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Kakak lupa ya? Cara pakainya: .${msgData.commandName} <url> yaa~ (˶˃ ᵕ ˂˶)` }, { quoted: m });
        }

        const url = msgData.args[0];
        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/facebook?url=${encodeURIComponent(url)}`);

            if (!data.success || !data.result) {
                throw new Error('Uwaaa, media dari Facebook-nya nggak ketemu atau link-nya rusak kak~ (╥﹏╥)');
            }

            const result = data.result;
            const media = result.media;

            // Filter videos: HD first, then fallback to SD
            let selectedVideos = (media.videos || []).filter(v => v.quality === 'hd');
            if (selectedVideos.length === 0) {
                selectedVideos = (media.videos || []).filter(v => v.quality === 'sd');
            }

            const selectedImages = media.images || [];
            const allMedia = [...selectedVideos, ...selectedImages];

            if (allMedia.length === 0) {
                throw new Error('Maafin aku kak, nggak ada media yang bisa aku download nih~ (｡T ω T｡)');
            }

            let first = true;
            for (const item of allMedia) {
                const caption = first ? (result.caption || result.title || `Ini dia videonya buat kakak @${msgData.senderJid.split('@')[0]} tercinta~ (๑>ᴗ<๑)`) : '';

                try {
                    const res = await axios.get(item.url, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                        }
                    });
                    const buffer = Buffer.from(res.data);

                    if (item.type === 'video') {
                        await sock.sendMessage(msgData.remoteJid, {
                            video: buffer,
                            mimetype: "video/mp4",
                            fileName: `video.mp4`,
                            caption: caption,
                            mentions: [msgData.senderJid],
                        }, { quoted: m });
                    } else if (item.type === 'image') {
                        await sock.sendMessage(msgData.remoteJid, {
                            image: buffer,
                            caption: caption,
                            mentions: [msgData.senderJid],
                        }, { quoted: m });
                    }
                } catch (e) {
                    console.error('Error sending media item:', e);
                }
                first = false;
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Facebook Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gawat kak! Ada error nih: ${errMsg}.. Tolong cek lagi yaa~ (⊙_⊙)` }, { quoted: m });
        }
    }
};
