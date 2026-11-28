import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['ytstalk', 'stalkyoutube', 'stalkyt', 'youtubestalk', 'cekyt'],
    category: 'stalk',
    isRegistered: true,
    limit: 1,
    description: 'Melihat informasi profil dan video terbaru channel YouTube',
    async execute(sock, m, msgData) {
        const rawInput = (msgData.args[0] || '').trim();
        const username = rawInput
            .replace(/^https?:\/\/(www\.|m\.)?youtube\.com\//i, '')
            .split(/[/?#]/)[0]
            .replace(/^@/, '');

        if (!username) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau stalk channel YouTube siapa? Kasih tahu Ryzumi username/handle-nya yaa~ (˶˃ ᵕ ˂˶)\n\nContoh:\n• \`.${msgData.commandName} FatihFirdaus404\`\n• \`.${msgData.commandName} @FatihFirdaus404\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/stalk/youtube?username=${encodeURIComponent(username)}`;
            const res = await axios.get(url);
            const result = res.data;
            const channel = result?.channelMetadata;

            if (!channel || (!channel.username && !channel.externalId)) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, channel YouTube \`@${username}\` nggak ketemu.. Cek lagi username-nya yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const videos = Array.isArray(result.videoDataList) ? result.videoDataList.slice(0, 5) : [];
            const familySafe = channel.isFamilySafe === true ? 'Ya' : (channel.isFamilySafe === false ? 'Tidak' : '-');

            const lines = [
                `📺 *YOUTUBE STALK* 📺`,
                ``,
                `╭─「 *INFO CHANNEL* 」`,
                `│ 👤 *Username:* ${channel.username || `@${username}`}`,
                `│ 🆔 *Channel ID:* \`${channel.externalId || '-'}\``,
                `│ 👥 *Subscribers:* ${channel.subscriberCount || '-'}`,
                `│ 🎬 *Total Video:* ${channel.videoCount || '-'}`,
                `│ 🛡️ *Family Safe:* ${familySafe}`,
                ...(channel.description ? [`│ 💬 *Deskripsi:* ${channel.description.replace(/\n+/g, ' ')}`] : []),
                `│ 🔗 *Channel:* ${channel.channelUrl || `https://www.youtube.com/@${username}`}`,
                `╰─────────────┈`
            ];

            if (videos.length > 0) {
                lines.push(``, `╭─「 *VIDEO TERBARU (${videos.length})* 」`);
                videos.forEach((video, idx) => {
                    const metaParts = [video.duration, video.viewCount, video.publishedTime].filter(Boolean).join(' • ');
                    const videoUrl = video.videoId
                        ? `https://youtu.be/${video.videoId}`
                        : (video.navigationUrl ? `https://www.youtube.com${video.navigationUrl}` : '-');

                    lines.push(
                        `│ ${idx + 1}. *${video.title || 'Tanpa Judul'}*`,
                        ...(metaParts ? [`│    📊 ${metaParts}`] : []),
                        `│    🔗 ${videoUrl}`
                    );
                });
                lines.push(`╰─────────────┈`);
            }

            lines.push(``, `Horeee! Itu tadi info channel YouTube-nya kak~ (๑>ᴗ<๑)`);

            const caption = lines.join('\n');

            if (channel.avatarUrl) {
                try {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: channel.avatarUrl },
                        caption
                    }, { quoted: m });
                } catch {
                    await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });
                }
            } else {
                await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });
            }

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Stalk YouTube Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mengambil data channel YouTube-nya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
