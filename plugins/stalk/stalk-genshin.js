import axios from 'axios';
import config from '../../config.js';

const formatNum = (num) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '-';
    return Number(num).toLocaleString('id-ID');
};

const formatKeyName = (str) => {
    if (!str) return '-';
    return String(str)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
};

const getRegionByUid = (uid) => {
    const str = String(uid || '');
    if (str.startsWith('6')) return 'America';
    if (str.startsWith('7')) return 'Europe';
    if (str.startsWith('8') || str.startsWith('18')) return 'Asia';
    if (str.startsWith('9')) return 'TW / HK / MO';
    if (/^[1235]/.test(str)) return 'China';
    return '-';
};

export default {
    command: ['gistalk', 'stalkgenshin', 'stalkgi', 'genshinstalk', 'cekgi'],
    category: 'stalk',
    isRegistered: true,
    limit: 1,
    description: 'Melihat informasi profil dan showcase karakter Genshin Impact',
    async execute(sock, m, msgData) {
        const uid = (msgData.args[0] || '').trim();

        if (!uid || !/^\d+$/.test(uid)) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak lupa masukin UID Genshin Impact-nya yaa? (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} 819226311\`\n\nKasih tahu Ryzumi UID-nya biar bisa dicek yaa~ (˶˃ ᵕ ˂˶)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/stalk/genshin?userId=${encodeURIComponent(uid)}`;
            const res = await axios.get(url);
            const result = res.data;
            const meta = result?.meta;

            if (!meta || !meta.uid) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, UID Genshin Impact \`${uid}\` nggak ketemu.. Cek lagi UID-nya yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const good = result.good || {};
            const abyss = meta.spiralAbyss;
            const theater = meta.theater;
            const stygian = meta.stygian;

            const lines = [
                `✨ *GENSHIN IMPACT STALK* ✨`,
                ``,
                `╭─「 *INFO PROFIL* 」`,
                `│ 👤 *Nickname:* ${meta.nickname || '-'}`,
                `│ 🆔 *UID:* \`${meta.uid}\``,
                `│ 🌍 *Server:* ${getRegionByUid(meta.uid)}`,
                `│ ⭐ *Adventure Rank:* AR ${meta.level ?? '-'}`,
                `│ 🌐 *World Level:* WL ${meta.worldLevel ?? '-'}`,
                `│ 🏆 *Achievements:* ${formatNum(meta.achievements)}`,
                ...(meta.signature ? [`│ 💬 *Signature:* ${meta.signature}`] : []),
                ...(meta.enkaUrl ? [`│ 🔗 *Enka:* ${meta.enkaUrl}`] : []),
                `╰─────────────┈`
            ];

            const endgameLines = [];
            if (abyss?.floor) {
                const stars = abyss.stars !== null && abyss.stars !== undefined ? ` (${abyss.stars}★)` : '';
                endgameLines.push(`│ 🌀 *Spiral Abyss:* Floor ${abyss.floor}-${abyss.chamber ?? 0}${stars}`);
            }
            if (theater?.act) {
                const stars = theater.stars !== null && theater.stars !== undefined ? ` (${theater.stars}★)` : '';
                endgameLines.push(`│ 🎭 *Imaginarium Theater:* Act ${theater.act}${stars}`);
            }
            if (stygian?.difficulty) {
                const time = stygian.clearTime ? ` (${stygian.clearTime}s)` : '';
                endgameLines.push(`│ ⚔️ *Stygian Onslaught:* Diff ${stygian.difficulty}${time}`);
            }

            if (endgameLines.length > 0) {
                lines.push(
                    ``,
                    `╭─「 *ENDGAME* 」`,
                    ...endgameLines,
                    `╰─────────────┈`
                );
            }

            const characters = Array.isArray(good.characters) ? good.characters : [];
            const weapons = Array.isArray(good.weapons) ? good.weapons : [];
            const previews = Array.isArray(meta.charactersPreview) ? meta.charactersPreview : [];

            if (characters.length > 0) {
                const weaponByChar = new Map(weapons.map((w) => [w.location, w]));
                lines.push(``, `╭─「 *CHARACTER SHOWCASE (${characters.length})* 」`);

                characters.forEach((char, idx) => {
                    const name = formatKeyName(char.key);
                    const cons = char.constellation ?? 0;
                    const talent = char.talent
                        ? `${char.talent.auto ?? 1}/${char.talent.skill ?? 1}/${char.talent.burst ?? 1}`
                        : null;
                    const weapon = weaponByChar.get(char.key);
                    const element = previews[idx]?.element ? ` [${previews[idx].element}]` : '';
                    const weaponText = weapon
                        ? `\n│    🗡️ ${formatKeyName(weapon.key)} (Lv.${weapon.level ?? '-'} R${weapon.refinement ?? 1})`
                        : '';

                    lines.push(
                        `│ ${idx + 1}. *${name}*${element} — Lv.${char.level ?? '-'} • C${cons}${talent ? ` • ${talent}` : ''}${weaponText}`
                    );
                });

                lines.push(`╰─────────────┈`);
            } else if (previews.length > 0) {
                lines.push(``, `╭─「 *CHARACTER PREVIEW (${previews.length})* 」`);
                previews.forEach((char, idx) => {
                    const cons = char.constellation !== null && char.constellation !== undefined ? ` • C${char.constellation}` : '';
                    lines.push(`│ ${idx + 1}. ${char.element || 'Unknown'} — Lv.${char.level ?? '-'}${cons}`);
                });
                lines.push(`╰─────────────┈`);
            }

            lines.push(``, `Horeee! Itu tadi info akun Genshin Impact-nya kak~ (๑>ᴗ<๑)`);

            await sock.sendMessage(msgData.remoteJid, {
                text: lines.join('\n')
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            console.error('Stalk Genshin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal mengambil data Genshin Impact-nya kak.. (╥﹏╥)\n\n*Error:* ${error.response?.data?.message || error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
