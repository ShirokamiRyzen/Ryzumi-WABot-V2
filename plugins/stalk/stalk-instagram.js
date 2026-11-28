import axios from 'axios';
import config from '../../config.js';

const formatNum = (num) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '-';
    return Number(num).toLocaleString('id-ID');
};

export default {
    command: ['igstalk', 'stalkinstagram', 'stalkig', 'instagramstalk', 'cekig'],
    category: 'stalk',
    isRegistered: true,
    limit: 1,
    description: 'Melihat informasi profil akun Instagram',
    async execute(sock, m, msgData) {
        const rawInput = (msgData.args[0] || '').trim();
        const username = rawInput
            .replace(/^https?:\/\/(www\.|m\.)?instagram\.com\//i, '')
            .split(/[/?#]/)[0]
            .replace(/^@/, '');

        if (!username) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau stalk akun Instagram siapa? Kasih tahu Ryzumi username-nya yaa~ (˶˃ ᵕ ˂˶)\n\nContoh:\n• \`.${msgData.commandName} fatih_frdaus\`\n• \`.${msgData.commandName} @fatih_frdaus\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/stalk/instagram?username=${encodeURIComponent(username)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!data || !data.username) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, akun Instagram \`@${username}\` nggak ketemu.. Cek lagi username-nya yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const verifiedText = data.verified ? 'Ya ☑️' : 'Tidak';
            const lines = [
                `📸 *INSTAGRAM STALK* 📸`,
                ``,
                `╭─「 *INFO PROFIL* 」`,
                `│ 👤 *Nama:* ${data.name || '-'}`,
                `│ 🔖 *Username:* @${data.username}`,
                `│ ✅ *Verified:* ${verifiedText}`,
                ...(data.bio ? [`│ 💬 *Bio:* ${data.bio}`] : []),
                `│ 🔗 *Profil:* https://www.instagram.com/${data.username}`,
                `╰─────────────┈`,
                ``,
                `╭─「 *STATISTIK* 」`,
                `│ 🖼️ *Posts:* ${formatNum(data.posts)}`,
                `│ 👥 *Followers:* ${formatNum(data.followers)}`,
                `│ 👤 *Following:* ${formatNum(data.following)}`,
                `╰─────────────┈`,
                ``,
                `Horeee! Itu tadi info akun Instagram-nya kak~ (๑>ᴗ<๑)`
            ];

            const caption = lines.join('\n');

            if (data.avatar) {
                try {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: data.avatar },
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
            console.error('Stalk Instagram Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mengambil data akun Instagram-nya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
