import axios from 'axios';
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
        let [nameArg, usernameArg, tweetArg] = msgData.args.join(' ').split('|');
        const targetJid = msgData.parseTargetJid() || msgData.senderJid;
        const targetUser = await User.findOne({ where: { jid: targetJid } });

        const displayName = nameArg?.trim() || targetUser?.name || msgData.pushName || 'User';
        const username = usernameArg?.trim() || displayName.replace(/\s+/g, '_').toLowerCase();
        let tweet = tweetArg?.trim() || (msgData.isQuoted ? getMessageContent(msgData.quotedMsg, msgData.quotedType) : '');

        if (!tweet) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(_ => config.RYZUMI_DEFAULT_PP);
            
            // Upload avatar ke CDN
            let avatar = ppUrl;
            try {
                const ppResponse = await axios.get(ppUrl, { responseType: 'arraybuffer' });
                const uploadResult = await ryzumiCDN(Buffer.from(ppResponse.data));
                avatar = uploadResult.url;
            } catch (e) {
                console.error('Fake Tweet Avatar CDN Error:', e);
            }

            let imageUrl = '';
            const bufferMedia = await msgData.downloadMedia();
            if (bufferMedia && /imageMessage/.test(msgData.isQuoted ? msgData.quotedType : msgData.messageType)) {
                try {
                    const uploadResult = await ryzumiCDN(bufferMedia);
                    imageUrl = uploadResult.url;
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
                const errorText = Buffer.from(response.data).toString();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || 'API gagal memproses gambar');
                } catch (e) {
                    throw new Error('API memberikan respon tidak valid (bukan gambar)');
                }
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
