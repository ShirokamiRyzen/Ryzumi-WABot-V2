import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['twitter', 'twt', 'x', 'twitterdl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh media dari Twitter / X.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { 
                text: `Kakak, tolong masukin link Twitter/X-nya dulu yaa~ (˶˃ ᵕ ˂˶)` 
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const url = msgData.args[0];
            let downloadResult = (await axios.get(`${config.API_RYZUMI}/api/downloader/twitter?url=${encodeURIComponent(url)}`)).data;

            // Fallback ke API V2 jika API pertama gagal memberikan hasil
            if (!downloadResult.status || !downloadResult.media || downloadResult.media.length === 0) {
                const tempResult = (await axios.get(`${config.API_RYZUMI}/api/downloader/v2/twitter?url=${encodeURIComponent(url)}`)).data;
                downloadResult = Array.isArray(tempResult) && tempResult.length > 0
                    ? { status: true, media: tempResult }
                    : { status: false, media: [] };
            }

            if (!downloadResult.status || !downloadResult.media || downloadResult.media.length === 0) {
                throw new Error('Gagal mendownload media dari Twitter/X kak.. (╥﹏╥)');
            }

            const type = downloadResult.type || 'video';
            const sender = msgData.senderJid.split('@')[0];

            if (type === 'image') {
                for (let i = 0; i < downloadResult.media.length; i++) {
                    const mediaUrl = downloadResult.media[i];
                    const caption = i === 0 ? `Ini foto Twitter buat kakak @${sender}~ (๑>ᴗ<๑)` : '';
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: mediaUrl },
                        caption: caption,
                        mentions: i === 0 ? [msgData.senderJid] : [],
                    }, { quoted: m });
                }
            } else {
                // Untuk video, ambil URL-nya (mendukung format obyek atau string langsung dari API)
                const mediaUrl = downloadResult.media[0].url || downloadResult.media[0];
                await sock.sendMessage(msgData.remoteJid, {
                    video: { url: mediaUrl },
                    caption: `Ini videonya buat kakak tercinta @${sender}~ (˶˃ ᵕ ˂˶)`,
                    mimetype: 'video/mp4',
                    mentions: [msgData.senderJid],
                }, { quoted: m });
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Twitter Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Uwaaa gawat! Ada error pas download Twitter/X: ${errMsg}.. (｡T ω T｡)` 
            }, { quoted: m });
        }
    }
};
