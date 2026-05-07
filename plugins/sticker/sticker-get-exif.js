import { format } from 'util';
import webpmux from 'node-webpmux';
import { downloadMediaMessage } from 'baileys';

export default {
    command: ['getexif', 'exif'],
    category: 'sticker',
    isRegistered: true,
    description: 'Melihat informasi EXIF (Packname & Author) dari sebuah stiker.',
    async execute(sock, m, msgData) {
        if (!msgData.isQuoted) {
            return sock.sendMessage(msgData.remoteJid, { text: 'Kakak, tolong balas stiker yang mau dicek informasinya yaa~ (˶˃ ᵕ ˂˶)' }, { quoted: m });
        }

        // Memastikan yang dibalas adalah stiker
        if (msgData.quotedType !== 'stickerMessage') {
            return sock.sendMessage(msgData.remoteJid, { text: 'Hee? Itu kan bukan stiker kak, bakaaa~ (๑>ᴗ<๑)' }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            // Mengunduh stiker
            const buffer = await downloadMediaMessage(
                { message: msgData.contextInfo.quotedMessage },
                'buffer',
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            const img = new webpmux.Image();
            await img.load(buffer);

            if (!img.exif) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, { text: 'Yaaah, stiker ini nggak punya metadata EXIF-nya kak.. (╥﹏╥)' }, { quoted: m });
            }

            // Metadata EXIF pada stiker WhatsApp biasanya diawali dengan header 22 byte
            // lalu diikuti dengan string JSON
            const rawExif = img.exif.slice(22).toString();

            try {
                const json = JSON.parse(rawExif);
                await sock.sendMessage(msgData.remoteJid, {
                    text: `*Metadata Stiker:*\n\n\`\`\`${format(json)}\`\`\``
                }, { quoted: m });
            } catch (e) {
                // Jika bukan JSON, tampilkan string mentahnya
                await sock.sendMessage(msgData.remoteJid, {
                    text: `*Raw Metadata:*\n\n${rawExif}`
                }, { quoted: m });
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Get Exif Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa, ada yang salah pas baca EXIF-nya: ${error.message}.. Maafin aku ya kak~ (｡T ω T｡)`
            }, { quoted: m });
        }
    }
};
