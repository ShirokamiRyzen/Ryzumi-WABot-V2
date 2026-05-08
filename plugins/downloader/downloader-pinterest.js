import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['pinterest', 'pin'],
    category: 'downloader',
    isRegistered: true,
    limit: 1,
    description: 'Mengunduh media (gambar/video) dari Pinterest.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Link Pinterest-nya mana Kakak~? Ketik .${msgData.commandName} <url> yaa! (๑>ᴗ<๑)` }, { quoted: m });
        }

        const url = msgData.args[0];
        await msgData.react('🕓');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/pinterest?url=${encodeURIComponent(url)}`);

            if (!data || (!data.image && !data.video)) {
                throw new Error('Maafin Ryzumi kak, datanya nggak ketemu atau medianya nggak ada.. (╥﹏╥)');
            }

            const { title, description, isImage, image, video } = data;
            const caption = `--- *PINTEREST DOWNLOADER* ---\n\n` +
                `📌 *Judul:* ${title || 'Tidak ada judul'}\n` +
                `📝 *Desc:* ${description || 'Tidak ada deskripsi'}\n\n` +
                `Ini medianya buat Kakak~! (˶˃ ᵕ ˂˶)`;

            // Fetch image buffer
            let imageBuffer = null;
            if (image && image.url) {
                try {
                    const res = await axios.get(image.url, { responseType: 'arraybuffer' });
                    imageBuffer = Buffer.from(res.data);
                } catch (e) {
                    console.error('Failed to fetch Pinterest image:', e.message);
                }
            }

            if (isImage) {
                // Case: isImage = true -> Send image only
                if (imageBuffer) {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: imageBuffer,
                        caption: caption,
                        mentions: [msgData.senderJid]
                    }, { quoted: m });
                } else {
                    throw new Error('Yahhh... Ryzumi gagal mendownload gambarnya kak (╥﹏╥)');
                }
            } else {
                // Case: isImage = false -> Send image AND video
                if (imageBuffer) {
                    await sock.sendMessage(msgData.remoteJid, {
                        image: imageBuffer,
                        caption: `${caption}\n\n*Note:* Ryzumi kirim preview gambarnya dulu ya kak~ ✨`,
                        mentions: [msgData.senderJid]
                    }, { quoted: m });
                }

                if (video && video.url) {
                    try {
                        const videoRes = await axios.get(video.url, { responseType: 'arraybuffer' });
                        const videoBuffer = Buffer.from(videoRes.data);

                        await sock.sendMessage(msgData.remoteJid, {
                            video: videoBuffer,
                            mimetype: "video/mp4",
                            fileName: `pinterest_video.mp4`,
                            caption: `Ini videonya buat Kakak~! (๑>ᴗ<๑)`,
                            mentions: [msgData.senderJid],
                        }, { quoted: m });
                    } catch (error) {
                        console.error('Pinterest Video Error:', error);
                        await sock.sendMessage(msgData.remoteJid, { text: `G-gagal kirim videonya kak: ${error.message} (╥﹏╥)` }, { quoted: m });
                    }
                }
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('Pinterest Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gawat kak! Ryzumi gagal: ${errMsg}.. (⊙_⊙)` }, { quoted: m });
        }
    }
};
