import axios from 'axios';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';
import { writeExif, imageToWebp } from '../../libs/sticker/sticker.js';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['qc', 'quotly'],
    category: 'sticker',
    isRegistered: true,
    description: 'Membuat stiker gelembung chat (Quotly).',
    async execute(sock, m, msgData, user) {
        // Ambil teks dari argumen atau dari pesan yang di-reply
        let text = msgData.args.join(' ');
        if (!text && msgData.isQuoted) {
            text = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            // Gunakan helper parseTargetJid dan default ke senderJid jika tidak ada target spesifik
            const targetJid = msgData.parseTargetJid() || msgData.senderJid;

            // Ambil nama dari database atau gunakan pushName
            let targetName;
            const targetUser = await User.findOne({ where: { jid: targetJid } });
            targetName = targetUser?.name || 'User';

            // Jika target adalah pengirim pesan ini, gunakan pushName terbaru
            if (targetJid === msgData.senderJid) {
                targetName = msgData.pushName;
            }

            // Ambil foto profil
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(_ => config.RYZUMI_DEFAULT_PP);
            
            // Upload avatar ke CDN
            let avatar = ppUrl;
            try {
                const ppResponse = await axios.get(ppUrl, { responseType: 'arraybuffer' });
                const uploadResult = await ryzumiCDN(Buffer.from(ppResponse.data));
                avatar = uploadResult.url;
            } catch (e) {
                console.error('QC Avatar CDN Error:', e);
            }

            const params = new URLSearchParams({
                text: text,
                name: targetName,
                avatar: avatar
            });

            const url = `${config.API_RYZUMI}/api/image/quotly?${params.toString()}`;

            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            // Cek apakah responnya beneran gambar
            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('image')) {
                const errorText = Buffer.from(response.data).toString();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || 'API gagal memproses stiker');
                } catch (e) {
                    throw new Error('API memberikan respon tidak valid (bukan gambar)');
                }
            }

            const stickerBuffer = await imageToWebp(Buffer.from(response.data));

            const exifData = { packName: config.BOT_NAME, packPublish: user.name };
            const finalSticker = await writeExif(stickerBuffer, exifData);

            await sock.sendMessage(msgData.remoteJid, { sticker: finalSticker }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('QC Sticker Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Uwaaa gawat! Gagal bikin stiker quotly-nya kak: ${error.message}.. (╥﹏╥)` 
            }, { quoted: m });
        }
    }
};
