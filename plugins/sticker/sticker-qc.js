import axios from 'axios';
import fetch from 'node-fetch';
import { writeExif, imageToWebp } from '../../libs/sticker/sticker.js';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['qc', 'quotly'],
    category: 'sticker',
    isRegistered: true,
    description: 'Membuat stiker gelembung chat (Quotly).',
    async execute(sock, m, msgData, user) {
        const { config, db, quotedContent, args, isQuoted, pushName, remoteJid, senderJid } = msgData;
        
        let text = args.join(' ');
        if (!text && isQuoted) {
            text = quotedContent;
        }

        if (!text) {
            return msgData.reply(config.RYZUMI_MSG_QUOTED);
        }

        await msgData.react('⏳');

        try {
            const targetJid = msgData.parseTargetJid() || senderJid;

            const targetUser = await db.User.findOne({ where: { jid: targetJid } });
            const targetName = targetJid === senderJid ? pushName : (targetUser?.name || 'User');

            // Ambil foto profil target dengan Raw Query via msgData (Global)
            const ppUrl = await msgData.getPP(targetJid, 'image');
            
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
                        avatar = uploadResult.url || (typeof uploadResult === 'string' ? uploadResult : ppUrl);
                        if (typeof avatar === 'object' && avatar.url) avatar = avatar.url;
                    }
                } catch (e) {
                    console.error('QC Avatar CDN Error:', e.message);
                }
            }

            // Final check untuk avatar
            if (!avatar || avatar === 'undefined') avatar = config.RYZUMI_DEFAULT_PP || 'https://telegra.ph/file/241d7180c0183058f3993.jpg';

            const params = new URLSearchParams({
                text: String(text),
                name: String(targetName),
                avatar: String(avatar)
            });

            const url = `${config.API_RYZUMI}/api/image/quotly?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            if (response.headers['content-type']?.includes('image')) {
                const stickerBuffer = await imageToWebp(Buffer.from(response.data));
                const exifData = { packName: config.BOT_NAME, packPublish: user.name };
                const finalSticker = await writeExif(stickerBuffer, exifData);
                await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: m });
            } else {
                throw new Error('API gagal mereturn gambar');
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('QC Sticker Error:', error);
            await msgData.react('❌');
            await msgData.reply(`Uwaaa gawat! Gagal bikin stiker quotly-nya kak: ${error.message}.. (╥﹏╥)`);
        }
    }
};
