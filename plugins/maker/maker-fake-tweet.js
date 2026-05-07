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
            const avatar = await sock.profilePictureUrl(targetJid, 'image').catch(_ => config.RYZUMI_DEFAULT_PP);

            let imageUrl = '';
            const buffer = await msgData.downloadMedia();
            if (buffer && /imageMessage/.test(msgData.isQuoted ? msgData.quotedType : msgData.messageType)) {
                try {
                    const uploadResult = await ryzumiCDN(buffer);
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
            
            await sock.sendMessage(msgData.remoteJid, { image: Buffer.from(response.data), caption: `Waaa! Tweet Kakak ${displayName} viral banget nih uwooo~! (˶˃ ᵕ ˂˶)` }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Fake Tweet Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { text: `Aduuh gawat! Ryzumi gagal bikin tweet-nya kak: ${error.message}.. (╥﹏╥)` }, { quoted: m });
        }
    }
};
