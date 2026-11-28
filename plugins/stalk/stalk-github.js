import axios from 'axios';
import moment from 'moment-timezone';
import config from '../../config.js';

const formatNum = (num) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '-';
    return Number(num).toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return moment(dateStr).tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm [WIB]');
};

export default {
    command: ['ghstalk', 'stalkgithub', 'stalkgh', 'githubstalk', 'cekgh'],
    category: 'stalk',
    isRegistered: true,
    limit: 1,
    description: 'Melihat informasi profil akun GitHub',
    async execute(sock, m, msgData) {
        const rawInput = (msgData.args[0] || '').trim();
        const username = rawInput
            .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
            .split(/[/?#]/)[0]
            .replace(/^@/, '');

        if (!username) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau stalk akun GitHub siapa? Kasih tahu Ryzumi username-nya yaa~ (˶˃ ᵕ ˂˶)\n\nContoh:\n• \`.${msgData.commandName} shirokamiryzen\`\n• \`.${msgData.commandName} https://github.com/ShirokamiRyzen\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/stalk/github?username=${encodeURIComponent(username)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!data || !data.login) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, akun GitHub \`${username}\` nggak ketemu.. Cek lagi username-nya yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const lines = [
                `🐙 *GITHUB STALK* 🐙`,
                ``,
                `╭─「 *INFO PROFIL* 」`,
                `│ 👤 *Nama:* ${data.name || '-'}`,
                `│ 🔖 *Username:* ${data.login}`,
                `│ 🆔 *ID:* \`${data.id ?? '-'}\``,
                `│ 🏷️ *Tipe:* ${data.type || '-'}`,
                ...(data.bio ? [`│ 💬 *Bio:* ${data.bio}`] : []),
                ...(data.company ? [`│ 🏢 *Company:* ${data.company}`] : []),
                ...(data.location ? [`│ 📍 *Lokasi:* ${data.location}`] : []),
                ...(data.blog ? [`│ 🌐 *Website:* ${data.blog}`] : []),
                ...(data.twitter_username ? [`│ 🐦 *Twitter:* @${data.twitter_username}`] : []),
                ...(data.email ? [`│ 📧 *Email:* ${data.email}`] : []),
                `│ 📅 *Dibuat:* ${formatDate(data.created_at)}`,
                `│ 🔄 *Update:* ${formatDate(data.updated_at)}`,
                `│ 🔗 *Profil:* ${data.html_url || `https://github.com/${data.login}`}`,
                `╰─────────────┈`,
                ``,
                `╭─「 *STATISTIK* 」`,
                `│ 📦 *Public Repos:* ${formatNum(data.public_repos)}`,
                `│ 📝 *Public Gists:* ${formatNum(data.public_gists)}`,
                `│ 👥 *Followers:* ${formatNum(data.followers)}`,
                `│ 👤 *Following:* ${formatNum(data.following)}`,
                `╰─────────────┈`,
                ``,
                `Horeee! Itu tadi info akun GitHub-nya kak~ (๑>ᴗ<๑)`
            ];

            const caption = lines.join('\n');

            if (data.avatar_url) {
                try {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: data.avatar_url },
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
            console.error('Stalk GitHub Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mengambil data akun GitHub-nya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
