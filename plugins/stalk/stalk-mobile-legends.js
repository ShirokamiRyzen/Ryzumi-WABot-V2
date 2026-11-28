import axios from 'axios';
import moment from 'moment-timezone';
import config from '../../config.js';

const formatNum = (num) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '-';
    return Number(num).toLocaleString('id-ID');
};

const formatWinRate = (wins, matches) => {
    if (!matches || matches <= 0) return '0%';
    return `${((wins / matches) * 100).toFixed(2)}%`;
};

const formatLastLogin = (lastLoginAt, lastLogin) => {
    if (lastLoginAt) {
        return moment(lastLoginAt).tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm [WIB]');
    }
    if (lastLogin) {
        return moment.unix(lastLogin).tz('Asia/Jakarta').format('DD MMM YYYY, HH:mm [WIB]');
    }
    return '-';
};

export default {
    command: ['mlstalk', 'stalkml', 'cekml'],
    category: 'stalk',
    isRegistered: true,
    limit: 1,
    description: 'Melihat informasi profil dan statistik pemain Mobile Legends',
    async execute(sock, m, msgData) {
        const input = msgData.args.join(' ').trim();
        const [userId, zoneId] = input.split(/[\s|,/()-]+/).filter(Boolean);

        if (!userId || !zoneId || !/^\d+$/.test(userId) || !/^\d+$/.test(zoneId)) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak lupa masukin User ID dan Zone ID Mobile Legends-nya yaa? (｡T ω T｡)\n\nContoh:\n• \`.${msgData.commandName} 78636603 2151\`\n• \`.${msgData.commandName} 78636603 (2151)\`\n\nKasih tahu Ryzumi ID & Server-nya yaa~ (˶˃ ᵕ ˂˶)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/stalk/mobile-legends?userId=${encodeURIComponent(userId)}&zoneId=${encodeURIComponent(zoneId)}`;
            const res = await axios.get(url);
            const result = res.data;

            if (!result?.status || !result?.data) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, data akun ML dengan ID \`${userId} (${zoneId})\` nggak ketemu.. Cek lagi ID dan Zone ID-nya yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const data = result.data;
            const profile = data.profile || {};
            const stats = data.stats || {};
            const collection = profile.collection || null;
            const kills = stats.kills || {};
            const byType = stats.byType || {};

            const nickname = profile.name || data.username || '-';
            const region = (data.countryCode || profile.countryCode || '-').toUpperCase();
            const rankName = profile.rank?.fullName || '-';
            const squadTitle = profile.nameDisplay?.title;
            const squadTag = profile.nameDisplay?.tag;
            const squadText = squadTitle ? `${squadTitle}${squadTag ? ` [${squadTag}]` : ''}` : null;
            const lastLogin = formatLastLogin(profile.lastLoginAt, profile.lastLogin);

            const lines = [
                `🎮 *MOBILE LEGENDS STALK* 🎮`,
                ``,
                `╭─「 *INFO PROFIL* 」`,
                `│ 👤 *Nickname:* ${nickname}`,
                `│ 🆔 *ID (Server):* \`${data.roleId || userId} (${data.zoneId || zoneId})\``,
                `│ 🌍 *Region:* ${region}`,
                `│ ⭐ *Level:* ${profile.level ?? '-'}`,
                `│ 🏆 *Rank:* ${rankName}`,
                ...(squadText ? [`│ 🛡️ *Squad:* ${squadText}`] : []),
                ...(profile.signature ? [`│ 💬 *Bio:* ${profile.signature}`] : []),
                `│ 💯 *Credit Score:* ${profile.creditScore ?? stats.reputation ?? '-'}`,
                `│ 🕒 *Last Login:* ${lastLogin}`,
                `╰─────────────┈`,
                ``,
                `╭─「 *KOLEKSI & SOSIAL* 」`,
                `│ 🦸 *Hero / Skin:* ${formatNum(profile.heroCount)} Hero • ${formatNum(profile.skinCount)} Skin`,
            ];

            if (collection) {
                lines.push(`│ 💎 *Collection:* Lv. ${collection.level ?? '-'} (${formatNum(collection.points)} / ${formatNum(collection.nextLevelPoints)} pts)`);
                if (collection.qualities) {
                    const q = collection.qualities;
                    lines.push(`│ ✨ *Tier Skin:* Grand ${formatNum(q.grand)} • Exq ${formatNum(q.exquisite)} • Dlx ${formatNum(q.deluxe)} • Exc ${formatNum(q.exceptional)} • Cmn ${formatNum(q.common)}`);
                }
            }

            lines.push(
                `│ 👥 *Followers / Following:* ${formatNum(profile.followers)} / ${formatNum(profile.following)}`,
                `│ ❤️ *Likes:* ${formatNum(profile.likes)} (Battle: ${formatNum(profile.battleLikes)})`,
                `╰─────────────┈`
            );

            if (stats.totalMatches !== undefined) {
                lines.push(
                    ``,
                    `╭─「 *STATISTIK MATCH* 」`,
                    `│ ⚔️ *Total Match:* ${formatNum(stats.totalMatches)}`,
                    `│ 🏅 *Win / Lose:* ${formatNum(stats.wins)} W / ${formatNum(stats.losses)} L (${stats.winRate ?? 0}%)`,
                    `│ 👑 *MVP:* ${formatNum(stats.mvp)} (Lose MVP: ${formatNum(stats.loseMvp)})`,
                    `│ 📊 *Avg KDA:* ${stats.avg?.kda ?? '-'}`,
                    `│ 🔥 *Savage / Maniac:* ${formatNum(kills.penta)} / ${formatNum(kills.quadra)}`,
                    `│ 💥 *Triple / Double:* ${formatNum(kills.triple)} / ${formatNum(kills.double)}`
                );

                const modes = [
                    { key: '2', label: 'Ranked' },
                    { key: '1', label: 'Classic' },
                    { key: '4', label: 'Brawl' }
                ];

                for (const mode of modes) {
                    const mStat = byType[mode.key];
                    if (mStat && mStat.matches > 0) {
                        lines.push(`│ 🎯 *${mode.label}:* ${formatNum(mStat.matches)} match (${formatWinRate(mStat.wins, mStat.matches)} WR)`);
                    }
                }

                lines.push(`╰─────────────┈`);
            }

            lines.push(``, `Horeee! Itu tadi data profil Mobile Legends-nya kak~ (๑>ᴗ<๑)`);

            await sock.sendMessage(msgData.remoteJid, {
                text: lines.join('\n')
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Stalk ML Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mengambil data Mobile Legends-nya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
