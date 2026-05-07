import { downloadMediaMessage } from 'baileys';
import { imageToWebp, videoToWebp, writeExif } from '../../libs/sticker/sticker.js';
import config from '../../config.js';

export default {
    command: ['sticker', 's', 'stiker', 'sgif'],
    category: 'maker',
    isRegistered: true, // Wajib daftar
    description: 'Mengubah gambar, video, atau gif (maksimal 10 detik) menjadi stiker WhatsApp.',
    async execute(sock, m, msgData, user) {
        try {
            const isTargetQuoted = msgData.isQuoted && msgData.isQuotedMedia;
            const hasMedia = isTargetQuoted || msgData.isMedia;

            if (!hasMedia) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Kirim/balas gambar, video, atau stiker dengan perintah .s untuk membuat stiker.' }, { quoted: m });
            }

            const targetMsg = isTargetQuoted ? msgData.quotedMsg : msgData.msg;
            const messageType = isTargetQuoted ? msgData.quotedType : msgData.messageType;
            const mime = isTargetQuoted ? msgData.quotedMime : msgData.mime;

            if (!/image|video|webp/.test(mime)) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Format media tidak didukung. Harap kirim/balas gambar, video, atau stiker.' }, { quoted: m });
            }

            const isVideoLike = /video|gif/.test(mime) || messageType === 'videoMessage';
            const seconds = Number(targetMsg[messageType]?.seconds || 0);
            if (isVideoLike && seconds > 10) {
                return sock.sendMessage(msgData.remoteJid, { text: 'Video/GIF harus berdurasi maksimal 10 detik.' }, { quoted: m });
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
                await sock.sendMessage(msgData.remoteJid, { react: { text: 'ERROR', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, { text: 'Gagal mengunduh media dari server WhatsApp. Coba ulangi lagi.' }, { quoted: m });
            }

            let webpBuffer = isVideoLike ? await videoToWebp(buffer) : await imageToWebp(buffer);

            const exifData = {
                packName: config.BOT_NAME || 'Ryzumi Bot',
                packPublish: user.name || 'User'
            };

            const finalSticker = await writeExif(webpBuffer, exifData);

            await sock.sendMessage(msgData.remoteJid, { sticker: finalSticker }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { react: { text: 'OK', key: m.key } });

        } catch (error) {
            console.error('Error in sticker plugin:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: 'ERROR', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, { text: `Gagal membuat stiker: ${error.message}` }, { quoted: m });
        }
    }
};
