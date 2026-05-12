import { imageToWebp, videoToWebp, writeExif } from '../../libs/sticker/sticker.js';

export default {
    command: ['sticker', 's', 'stiker', 'sgif'],
    category: 'sticker',
    isRegistered: true,
    description: 'Mengubah gambar, video, atau gif (maksimal 10 detik) menjadi stiker WhatsApp.',
    async execute(sock, m, msgData, user) {
        const { config, remoteJid, isQuoted, isQuotedMedia, isMedia, messageType, quotedMsg, msg, quotedType, quotedMime, mime } = msgData;

        try {
            const isTargetQuoted = isQuoted && isQuotedMedia;
            const hasMedia = isTargetQuoted || isMedia;

            if (!hasMedia) {
                return msgData.reply('Kirim atau balas gambar/video yang mau dijadiin stiker ya kak~ (˶˃ ᵕ ˂˶) .ᐟ.ᐟ');
            }

            const targetMsg = isTargetQuoted ? quotedMsg : msg;
            const type = isTargetQuoted ? quotedType : messageType;
            const mediaMime = isTargetQuoted ? quotedMime : mime;

            if (!/image|video|webp/.test(mediaMime)) {
                return msgData.reply('Uwaaa gomenasai kak, format medianya nggak didukung~ (╥﹏╥)');
            }

            const isVideoLike = /video|gif/.test(mediaMime) || type === 'videoMessage';
            const seconds = Number(targetMsg[type]?.seconds || 0);
            if (isVideoLike && seconds > 10) {
                return msgData.reply('Aduuh, durasi videonya kepanjangan kak! Maksimal 10 detik aja yaa~ (๑>ᴗ<๑) 💢');
            }

            await msgData.react('⏳');

            const buffer = await msgData.downloadMedia();
            if (!buffer) {
                throw new Error('Gagal mengunduh media kak.. (｡T ω T｡)');
            }

            let webpBuffer = isVideoLike ? await videoToWebp(buffer) : await imageToWebp(buffer);

            const exifData = {
                packName: config.BOT_NAME || 'Ryzumi Bot',
                packPublish: user.name || 'User'
            };

            const finalSticker = await writeExif(webpBuffer, exifData);
            await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: m });
            await msgData.react('✅');

        } catch (error) {
            console.error('Error in sticker plugin:', error);
            await msgData.react('❌');
            await msgData.reply(`Waaa gawat! Stikernya gagal dibuat: ${error.message}.. (´･ᴗ･ \` )`);
        }
    }
};
