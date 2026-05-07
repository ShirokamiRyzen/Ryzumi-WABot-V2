import { downloadMediaMessage } from 'baileys';
import { imageToWebp, videoToWebp, writeExif } from '../../libs/sticker/sticker.js';
import config from '../../config.js';

export default {
    command: ['sticker', 's', 'stiker', 'sgif'],
    category: 'sticker',
    isRegistered: true, // Wajib daftar
    description: 'Mengubah gambar, video, atau gif (maksimal 10 detik) menjadi stiker WhatsApp.',
    async execute(sock, m, msgData, user) {
        try {
            const isTargetQuoted = msgData.isQuoted && msgData.isQuotedMedia;
            const hasMedia = isTargetQuoted || msgData.isMedia;

            if (!hasMedia) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Kirim atau balas gambar/video yang mau dijadiin stiker ya kak~ (˶˃ ᵕ ˂˶) .ᐟ.ᐟ' }, { quoted: m });
            }

            const targetMsg = isTargetQuoted ? msgData.quotedMsg : msgData.msg;
            const messageType = isTargetQuoted ? msgData.quotedType : msgData.messageType;
            const mime = isTargetQuoted ? msgData.quotedMime : msgData.mime;

            if (!/image|video|webp/.test(mime)) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Uwaaa gomenasai kak, format medianya nggak didukung~ (╥﹏╥)' }, { quoted: m });
            }

            const isVideoLike = /video|gif/.test(mime) || messageType === 'videoMessage';
            const seconds = Number(targetMsg[messageType]?.seconds || 0);
            if (isVideoLike && seconds > 10) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Aduuh, durasi videonya kepanjangan kak! Maksimal 10 detik aja yaa~ (๑>ᴗ<๑) 💢' }, { quoted: m });
            }

            const downloadMsg = { message: targetMsg };
            let buffer;
            try {
                buffer = await downloadMediaMessage(
                    downloadMsg,
                    'buffer',
                    {},
                    {
                        logger: sock.logger,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            } catch (err) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Maafin aku ya kak, gagal download medianya.. Coba lagi nanti yaa~ (｡T ω T｡)' }, { quoted: m });
            }

            let webpBuffer = isVideoLike ? await videoToWebp(buffer) : await imageToWebp(buffer);

            const exifData = {
                packName: config.BOT_NAME || 'Ryzumi Bot',
                packPublish: user.name || 'User'
            };

            const finalSticker = await writeExif(webpBuffer, exifData);

            await sock.sendMessage(msgData.remoteJid, { sticker: finalSticker }, { quoted: m });

        } catch (error) {
            console.error('Error in sticker plugin:', error);
            await sock.sendMessage(msgData.remoteJid, { text: `Waaa gawat! Stikernya gagal dibuat: ${error.message}.. (´･ᴗ･ \` )` }, { quoted: m });
        }
    }
};
