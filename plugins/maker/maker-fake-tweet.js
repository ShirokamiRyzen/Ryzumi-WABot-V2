import axios from 'axios';
import fetch from 'node-fetch';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';
import { ryzumiCDN } from '../../libs/uploader.js';
import { getGroupMetadata } from '../../libs/groupCache.js';

export default {
    command: ['faketweet', 'tweet'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan Tweet palsu (Fake Tweet).',
    async execute(sock, m, msgData) {
        const fullArgs = msgData.args.join(' ');
        let [nameArg, usernameArg, tweetArg] = fullArgs.split('|');
        
        let targetJid = msgData.parseTargetJid() || msgData.senderJid;

        // Optimasi resolusi JID (LID ke JID)
        if (targetJid.endsWith('@lid') && msgData.isGroup) {
            const metadata = getGroupMetadata(msgData.remoteJid);
            if (metadata) {
                const groupParticipant = metadata.participants.find(p => p.id === targetJid || p.lid === targetJid || p.id?.split('@')[0] === targetJid.split('@')[0]);
                if (groupParticipant && groupParticipant.id && !groupParticipant.id.endsWith('@lid')) {
                    targetJid = groupParticipant.id;
                }
            }
        }

        const targetUser = await User.findOne({ where: { jid: targetJid } });
        const displayName = nameArg?.trim() || (targetJid === msgData.senderJid ? msgData.pushName : (targetUser?.name || 'User'));
        const username = usernameArg?.trim() || displayName.replace(/\s+/g, '_').toLowerCase();
        
        let tweet = tweetArg?.trim();
        if (!tweet && msgData.isQuoted) {
            tweet = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        if (!tweet && nameArg && !fullArgs.includes('|')) {
            tweet = nameArg;
        }

        if (!tweet) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            // Ambil foto profil target dengan fallback berlapis
            let ppUrl = config.RYZUMI_DEFAULT_PP || 'https://telegra.ph/file/241d7180c0183058f3993.jpg';
            try {
                const cleanJid = targetJid.split(':')[0].split('@')[0] + (targetJid.includes('@lid') ? '@lid' : '@s.whatsapp.net');
                const waPp = await sock.profilePictureUrl(cleanJid, 'image');
                if (waPp) ppUrl = waPp;
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
                        avatar = uploadResult.url || (typeof uploadResult === 'string' ? uploadResult : ppUrl);
                        if (typeof avatar === 'object' && avatar.url) avatar = avatar.url;
                    }
                } catch (e) {
                    console.error('Fake Tweet Avatar CDN Error:', e.message);
                }
            }

            let imageUrl = '';
            const bufferMedia = await msgData.downloadMedia();
            if (bufferMedia && /imageMessage/.test(msgData.isQuoted ? msgData.quotedType : msgData.messageType)) {
                try {
                    const uploadResult = await ryzumiCDN(bufferMedia);
                    imageUrl = uploadResult.url || uploadResult;
                    if (typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url;
                } catch (e) {
                    console.error('Upload Media Error:', e);
                }
            }

            // Pastikan avatar tidak undefined sebelum masuk params
            if (!avatar) avatar = config.RYZUMI_DEFAULT_PP || 'https://telegra.ph/file/241d7180c0183058f3993.jpg';

            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            const params = new URLSearchParams({
                bg: 'dim', 
                avatar: String(avatar), 
                name: String(displayName), 
                username: String(username), 
                tweet: String(tweet),
                retweets: String(rand(200, 1000)), 
                comment: String(rand(200, 1000)), 
                likes: String(rand(500, 2000)),
                verified: 'true'
            });
            if (imageUrl) params.set('image', imageUrl);

            const url = `${config.API_RYZUMI}/api/image/faketweet?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });

            if (response.headers['content-type']?.includes('image')) {
                await sock.sendMessage(msgData.remoteJid, { image: Buffer.from(response.data), caption: `Waaa! Tweet Kakak ${displayName} viral banget nih~! (˶˃ ᵕ ˂˶)` }, { quoted: m });
            } else {
                throw new Error('API gagal mereturn gambar');
            }
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Fake Tweet Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { text: `Aduuh gawat! Ryzumi gagal bikin tweet-nya kak: ${error.message}.. (╥﹏╥)` }, { quoted: m });
        }
    }
};
