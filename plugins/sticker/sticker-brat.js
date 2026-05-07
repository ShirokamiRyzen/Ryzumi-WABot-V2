import axios from 'axios';
import config from '../../config.js';
import { writeExif, imageToWebp, videoToWebp } from '../../libs/sticker/sticker.js';

export default {
    command: ['brat', 'bratvid', 'bratvideo'],
    category: 'sticker',
    isRegistered: true,
    description: 'Membuat stiker teks bergaya Brat (putih dengan latar belakang hitam).',
    async execute(sock, m, msgData, user) {
        let text = msgData.args.join(' ');
        if (!text) {
            return sock.sendMessage(msgData.remoteJid, { text: `Kakak mau buat stiker brat? Kasih teksnya dulu dong~ .${msgData.commandName} <teks> yaa! (˶˃ ᵕ ˂˶)` }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            let endpoint = '/api/image/brat?text=';
            let isAnimated = false;

            if (/vid|video/i.test(msgData.commandName)) {
                endpoint = '/api/image/brat/animated?text=';
                isAnimated = true;
            }

            const url = `${config.API_RYZUMI}${endpoint}${encodeURIComponent(text)}`;
            const { data } = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            // Konversi ke WebP agar ukuran dan formatnya sesuai standar stiker WhatsApp (512x512)
            let stickerBuffer;
            if (isAnimated) {
                stickerBuffer = await videoToWebp(data);
            } else {
                stickerBuffer = await imageToWebp(data);
            }

            // Tambahkan metadata EXIF (packname & author)
            const exifData = {
                packName: config.BOT_NAME,
                packPublish: user.name
            };
            const finalSticker = await writeExif(stickerBuffer, exifData);

            await sock.sendMessage(msgData.remoteJid, { sticker: finalSticker }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Brat Sticker Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Uwaaa gomenasai kak, stiker brat-nya gagal dibuat: ${errMsg}.. (╥﹏╥)` }, { quoted: m });
        }
    }
};
