import axios from 'axios';
import moment from 'moment-timezone';
import config from '../../config.js';

const formatNum = (num) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '-';
    return Number(num).toLocaleString('id-ID');
};

const formatJoinedAt = (joinedAt) => {
    if (!joinedAt) return '-';
    const parsed = new Date(joinedAt);
    if (Number.isNaN(parsed.getTime())) return joinedAt;
    return moment(parsed).tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm [WIB]');
};

export default {
    command: ['stalktwt', 'stalktwitter', 'stalkx', 'twtstalk', 'xstalk'],
    category: 'stalk',
    isRegistered: true,
    limit: 1,
    description: 'Melihat informasi profil akun Twitter / X',
    async execute(sock, m, msgData) {
        const rawInput = (msgData.args[0] || '').trim();
        const username = rawInput
            .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, '')
            .split(/[/?#]/)[0]
            .replace(/^@/, '');

        if (!username) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau stalk akun Twitter/X siapa? Kasih tahu Ryzumi username-nya yaa~ (˶˃ ᵕ ˂˶)\n\nContoh:\n• \`.${msgData.commandName} Shirokami_Ryzen\`\n• \`.${msgData.commandName} @Shirokami_Ryzen\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/stalk/twitter?username=${encodeURIComponent(username)}`;
            const res = await axios.get(url);
            const result = res.data;
            const user = result?.user;

            if (!user || !user.screen_name) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, akun Twitter/X \`@${username}\` nggak ketemu.. Cek lagi username-nya yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const websiteUrl = user.website?.url || user.website?.display_url || null;
            const lines = [
                `🐦 *TWITTER / X STALK* 🐦`,
                ``,
                `╭─「 *INFO PROFIL* 」`,
                `│ 👤 *Nama:* ${user.name || '-'}`,
                `│ 🔖 *Username:* @${user.screen_name}`,
                `│ 🆔 *ID:* \`${user.id || '-'}\``,
                ...(user.description ? [`│ 💬 *Bio:* ${user.description}`] : []),
                ...(user.location ? [`│ 📍 *Lokasi:* ${user.location}`] : []),
                ...(websiteUrl ? [`│ 🌐 *Website:* ${websiteUrl}`] : []),
                `│ 📅 *Bergabung:* ${formatJoinedAt(user.joined_at)}`,
                `│ 🔗 *Profil:* ${user.url || `https://x.com/${user.screen_name}`}`,
                `╰─────────────┈`,
                ``,
                `╭─「 *STATISTIK* 」`,
                `│ 👥 *Followers:* ${formatNum(user.followers)}`,
                `│ 👤 *Following:* ${formatNum(user.following)}`,
                `│ ❤️ *Likes:* ${formatNum(user.likes)}`,
                `╰─────────────┈`,
                ``,
                `Horeee! Itu tadi info akun Twitter/X-nya kak~ (๑>ᴗ<๑)`
            ];

            const caption = lines.join('\n');

            if (user.avatar_url) {
                try {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: user.avatar_url },
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
            console.error('Stalk Twitter Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mengambil data akun Twitter/X-nya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
