import axios from 'axios';
import fetch from 'node-fetch';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['faketweet', 'tweet'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan Tweet palsu (Fake Tweet).',
    async execute(sock, m, msgData) {
        const { config, db, quotedContent, args, isQuoted, pushName, remoteJid, senderJid, messageType } = msgData;
        
        const fullArgs = args.join(' ');
        let [nameArg, usernameArg, tweetArg] = fullArgs.split('|');

        const targetJid = msgData.parseTargetJid() || senderJid;

        const targetUser = await db.User.findOne({ where: { jid: targetJid } });
        const displayName = nameArg?.trim() || (targetJid === senderJid ? pushName : (targetUser?.name || 'User'));
        const username = usernameArg?.trim() || displayName.replace(/\s+/g, '_').toLowerCase();

        let tweet = tweetArg?.trim();
        if (!tweet && isQuoted) {
            tweet = quotedContent;
        }

        if (!tweet && nameArg && !fullArgs.includes('|')) {
            tweet = nameArg;
        }

        if (!tweet) {
            return msgData.reply(config.RYZUMI_MSG_QUOTED);
        }

        await msgData.react('⏳');

        try {
            // Ambil foto profil target dengan Raw Query via msgData (Global)
            const ppUrl = await msgData.getPP(targetJid, 'image');

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
                        const ppBuffer = Buffer.from(await ppRes.arrayBuffer());
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
            if (bufferMedia && /imageMessage/.test(isQuoted ? msgData.quotedType : messageType)) {
                try {
                    const uploadResult = await ryzumiCDN(bufferMedia);
                    imageUrl = uploadResult.url || uploadResult;
                    if (typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url;
                } catch (e) {
                    console.error('Upload Media Error:', e);
                }
            }

            // Final check untuk avatar
            if (!avatar || avatar === 'undefined') avatar = config.RYZUMI_DEFAULT_PP || 'https://telegra.ph/file/241d7180c0183058f3993.jpg';

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
            if (imageUrl) params.set('image', String(imageUrl));

            const url = `${config.API_RYZUMI}/api/image/faketweet?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });

            if (response.headers['content-type']?.includes('image')) {
                await sock.sendMessage(remoteJid, { image: Buffer.from(response.data), caption: `Waaa! Tweet Kakak ${displayName} viral banget nih~! (˶˃ ᵕ ˂˶)` }, { quoted: m });
            } else {
                throw new Error('API gagal mereturn gambar');
            }
            await msgData.react('✅');

        } catch (error) {
            console.error('Fake Tweet Error:', error);
            await msgData.react('❌');
            await msgData.reply(`Aduuh gawat! Ryzumi gagal bikin tweet-nya kak: ${error.message}.. (╥﹏╥)`);
        }
    }
};
