import axios from 'axios';
import fetch from 'node-fetch';
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
            const targetUser = await User.findOne({ where: { jid: targetJid } });
            const targetName = targetJid === msgData.senderJid ? msgData.pushName : (targetUser?.name || 'User');

            // Ambil foto profil
            let ppUrl = config.RYZUMI_DEFAULT_PP;
            try {
                const cleanJid = targetJid.split(':')[0].split('@')[0] + (targetJid.includes('@lid') ? '@lid' : '@s.whatsapp.net');
                ppUrl = await sock.profilePictureUrl(cleanJid, 'image').catch(_ => config.RYZUMI_DEFAULT_PP);
            } catch (e) {}
            
            // Upload avatar ke CDN
            let avatar = ppUrl;
            if (ppUrl && ppUrl.startsWith('http')) {
                try {
                    const ppRes = await fetch(ppUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                        }
                    });
                    if (ppRes.ok) {
                        const ppBuffer = await ppRes.buffer();
                        const uploadResult = await ryzumiCDN(ppBuffer);
                        avatar = uploadResult.url || uploadResult;
                    }
                } catch (e) {
                    console.error('QC Avatar CDN Error:', e.message);
                }
            }

            const params = new URLSearchParams({
                text: text,
                name: targetName,
                avatar: avatar
            });

            const url = `${config.API_RYZUMI}/api/image/quotly?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('image')) {
                throw new Error('API memberikan respon tidak valid (bukan gambar)');
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
