import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['aio', 'aiodl'],
    category: 'downloader',
    isRegistered: true,
    limit: 1,
    description: 'Mengunduh media dari berbagai platform sosial media (All-In-One).',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Kakak manis~ Cara pakainya: .${msgData.commandName} <url> yaa! (˶˃ ᵕ ˂˶)` }, { quoted: m });
        }

        const url = msgData.args[0];

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const response = await axios.get(`${config.API_RYZUMI}/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
            const data = response.data;

            if (!data || !data.medias || data.medias.length === 0) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Aduuh, medianya nggak ketemu atau link-nya rusak kak.. Maafin aku yaa~ (╥﹏╥)' }, { quoted: m });
            }

            const { title, source, author, medias } = data;
            const caption = `*${title || 'Gak ada deskripsinya kak...'}*\n\n*Asalnya dari:* ${source || 'Misterius'} (´･ᴗ･ \` )\n*Dibuat oleh:* ${author?.name || author?.username || 'Seseorang'} (๑>ᴗ<๑)`.trim();

            for (let i = 0; i < medias.length; i++) {
                const media = medias[i];
                const msgCaption = i === 0 ? caption : '';

                if (media.type === 'video') {
                    await sock.sendMessage(msgData.remoteJid, {
                        video: { url: media.url },
                        caption: msgCaption,
                        mimetype: 'video/mp4'
                    }, { quoted: m });
                } else if (media.type === 'image') {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: { url: media.url },
                        caption: msgCaption
                    }, { quoted: m });
                } else if (media.type === 'audio') {
                    await sock.sendMessage(msgData.remoteJid, {
                        audio: { url: media.url },
                        mimetype: media.extension === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
                        ptt: false
                    }, { quoted: m });
                }
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('All-In-One Downloader Error:', error);

            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Uwaaa gawat! Ada error pas download: ${errMsg}.. Tolong dibantu kak~ (｡T ω T｡)` }, { quoted: m });
        }
    }
};
