import yts from 'yt-search';

export default {
    command: ['ytsearch', 'yts'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari video di YouTube',
    async execute(sock, m, msgData) {
        const text = msgData.args.join(' ');

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari apa di YouTube? Kasih tahu Ryzumi yaa~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} anime song\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const results = await yts(text);
            const videos = results.all.filter(v => v.type === 'video');

            if (videos.length === 0) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, video yang kakak cari nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            const teks = videos.map((v, i) => {
                return `*${i + 1}. ${v.title}*\n↳ 🕒 *Durasi:* ${v.timestamp}\n↳ 📥 *Diunggah:* ${v.ago}\n↳ 👁 *Views:* ${v.views.toLocaleString()}\n↳ 🔗 *Link:* ${v.url}`;
            }).join('\n\n◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦\n\n');

            const caption = `
🔍 *HASIL PENCARIAN YOUTUBE* 🔍

${teks}

Horeee! Itu tadi hasil pencariannya kak~ Pilih salah satu yaa! (๑>ᴗ<๑)
`.trim();

            await sock.sendMessage(msgData.remoteJid, {
                image: { url: videos[0].thumbnail },
                caption: caption
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('YouTube Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing pas nyari video di YouTube kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
