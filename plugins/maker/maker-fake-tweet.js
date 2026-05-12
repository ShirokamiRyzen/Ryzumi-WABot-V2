import axios from 'axios';
import fetch from 'node-fetch';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['faketweet', 'tweet'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan Tweet palsu (Fake Tweet).',
    async execute(sock, m, msgData) {
        const fullArgs = msgData.args.join(' ');
        let [nameArg, usernameArg, tweetArg] = fullArgs.split('|');
        
        const targetJid = msgData.parseTargetJid() || msgData.senderJid;
        const targetUser = await User.findOne({ where: { jid: targetJid } });

        const displayName = nameArg?.trim() || (targetJid === msgData.senderJid ? msgData.pushName : (targetUser?.name || 'User'));
        const username = usernameArg?.trim() || displayName.replace(/\s+/g, '_').toLowerCase();
        
        let tweet = tweetArg?.trim();
        if (!tweet && msgData.isQuoted) {
            tweet = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        // Jika tidak ada pemisah | dan tweet masih kosong, mungkin argumen pertama adalah tweet
        if (!tweet && nameArg && !fullArgs.includes('|')) {
            tweet = nameArg;
        }

        if (!tweet) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
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
                    console.error('Fake Tweet Avatar CDN Error:', e.message);
                }
            }

            let imageUrl = '';
            const bufferMedia = await msgData.downloadMedia();
            if (bufferMedia && /imageMessage/.test(msgData.isQuoted ? msgData.quotedType : msgData.messageType)) {
                try {
                    const uploadResult = await ryzumiCDN(bufferMedia);
                    imageUrl = uploadResult.url || uploadResult;
                } catch (e) {
                    console.error('Upload Media Error:', e);
                }
            }

            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            const params = new URLSearchParams({
                bg: 'dim', avatar, name: displayName, username, tweet,
                retweets: rand(200, 1000), comment: rand(200, 1000), likes: rand(500, 2000),
                verified: 'true'
            });
            if (imageUrl) params.set('image', imageUrl);

            const url = `${config.API_RYZUMI}/api/image/faketweet?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });

            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('image')) {
                throw new Error('API memberikan respon tidak valid (bukan gambar)');
            }

            await sock.sendMessage(msgData.remoteJid, { image: Buffer.from(response.data), caption: `Waaa! Tweet Kakak ${displayName} viral banget nih~! (˶˃ ᵕ ˂˶)` }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Fake Tweet Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { text: `Aduuh gawat! Ryzumi gagal bikin tweet-nya kak: ${error.message}.. (╥﹏╥)` }, { quoted: m });
        }
    }
};
