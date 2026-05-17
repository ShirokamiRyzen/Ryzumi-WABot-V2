import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['twitter', 'x', 'xdl', 'twitterdl'],
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
            const response = await axios.get(`${config.API_RYZUMI}/api/downloader/twitter?url=${encodeURIComponent(url)}`);
            const downloadResult = response.data;

            if (!downloadResult.status || !downloadResult.media || downloadResult.media.length === 0) {
                throw new Error('Gagal mendownload media dari Twitter/X kak.. (╥﹏╥)');
            }

            const type = downloadResult.type || 'video';
            const sender = msgData.senderJid.split('@')[0];

            // Build beautiful info/caption from the metadata
            const { text, likes, retweets, replies, user } = downloadResult;
            const authorName = user?.name || 'Unknown';
            const authorUsername = user?.username ? `@${user.username}` : 'unknown';

            const captionInfo = `*Twitter/X Downloader* ✨\n\n` +
                `*Uploader:* ${authorName} (${authorUsername})\n` +
                `*Tweet:* ${text || '-'}\n\n` +
                `*Statistik:* ❤️ ${likes || 0} | 🔁 ${retweets || 0} | 💬 ${replies || 0}`;

            if (type === 'image') {
                for (let i = 0; i < downloadResult.media.length; i++) {
                    const mediaItem = downloadResult.media[i];
                    const mediaUrl = typeof mediaItem === 'object' ? mediaItem.url : mediaItem;
                    const caption = i === 0 ? `Ini foto Twitter buat kakak @${sender}~ (๑>ᴗ<๑)\n\n${captionInfo}` : '';

                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: mediaUrl },
                        caption: caption,
                        mentions: i === 0 ? [msgData.senderJid] : [],
                    }, { quoted: m });
                }
            } else {
                const mediaItem = downloadResult.media[0];
                const mediaUrl = typeof mediaItem === 'object' ? mediaItem.url : mediaItem;

                await sock.sendMessage(msgData.remoteJid, {
                    video: { url: mediaUrl },
                    caption: `Ini videonya buat kakak tercinta @${sender}~ (˶˃ ᵕ ˂˶)\n\n${captionInfo}`,
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
