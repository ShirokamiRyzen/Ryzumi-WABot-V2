import { downloadMediaMessage } from 'baileys';
import { webp2mp4, webp2png } from '../../libs/webp2mp4.js';
import axios from 'axios';

export default {
    command: ['toimg', 'tovideo', 'tomp4'],
    category: 'sticker',
    isRegistered: true,
    limit: true,
    description: 'Mengubah stiker menjadi gambar (toimg) atau video (tovideo/tomp4).',
    async execute(sock, m, msgData) {
        // Memastikan yang dibalas adalah stiker
        if (!msgData.isQuoted || msgData.quotedType !== 'stickerMessage') {
            return sock.sendMessage(msgData.remoteJid, { 
                text: 'Kakak, tolong balas stiker yang mau diubah dong~ (˶˃ ᵕ ˂˶)' 
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            // Unduh stiker yang dibalas
            const buffer = await downloadMediaMessage(
                { message: msgData.quotedMsg },
                'buffer',
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            let resultUrl;
            let isVideo = false;

            // Logika berdasarkan perintah
            if (msgData.commandName === 'toimg') {
                resultUrl = await webp2png(buffer);
            } else {
                resultUrl = await webp2mp4(buffer);
                isVideo = true;
            }

            if (!resultUrl) {
                throw new Error('Gagal mengonversi media. Mungkin stikernya terlalu besar atau ada masalah di server EZGIF.. (╥﹏╥)');
            }

            // Ambil buffer hasil konversi
            const res = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const finalBuffer = Buffer.from(res.data);

            if (isVideo) {
                await sock.sendMessage(msgData.remoteJid, {
                    video: finalBuffer,
                    caption: 'Ini videonya kak, sudah jadi~! (๑>ᴗ<๑)',
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await sock.sendMessage(msgData.remoteJid, {
                    image: finalBuffer,
                    caption: 'Ini gambarnya buat kakak~ (˶˃ ᵕ ˂˶)'
                }, { quoted: m });
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Sticker to Media Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Maafin aku ya kak, gagal ngubah stikernya: ${error.message}.. (｡T ω T｡)` 
            }, { quoted: m });
        }
    }
};
