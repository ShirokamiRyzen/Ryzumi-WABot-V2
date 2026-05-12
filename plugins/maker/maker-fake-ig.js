import axios from 'axios';
import fetch from 'node-fetch';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';
import { ryzumiCDN } from '../../libs/uploader.js';
import { getGroupMetadata } from '../../libs/groupCache.js';

export default {
    command: ['fakestory', 'fakeig'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan cerita Instagram palsu (Fake Story).',
    async execute(sock, m, msgData, user) {
        // Ambil data dari argumen atau quote
        const fullArgs = msgData.args.join(' ');
        let [usernameArg, ...captionArgs] = fullArgs.split('|');
        
        let username = usernameArg?.trim();
        let caption = captionArgs.join('|').trim();

        if (!caption && msgData.isQuoted) {
            caption = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        if (!caption && usernameArg && !fullArgs.includes('|')) {
            caption = usernameArg;
            username = ''; 
        }

        if (!caption) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Kakak manis~ Cara pakainya gini yaa:\n*.fakestory username|caption*\n\nAtau balas pesan teks dengan *.fakestory username*~ (˶˃ ᵕ ˂˶)`
            }, { quoted: m });
        }

        // Ambil target JID (default ke pengirim)
        let targetJid = msgData.parseTargetJid() || msgData.senderJid;

        // Optimasi resolusi JID (LID ke JID) seperti di welcome/leave
        if (targetJid.endsWith('@lid') && msgData.isGroup) {
            const metadata = getGroupMetadata(msgData.remoteJid);
            if (metadata) {
                const groupParticipant = metadata.participants.find(p => p.id === targetJid || p.lid === targetJid || p.id?.split('@')[0] === targetJid.split('@')[0]);
                if (groupParticipant && groupParticipant.id && !groupParticipant.id.endsWith('@lid')) {
                    targetJid = groupParticipant.id;
                }
            }
        }

        // Fallback untuk username (Nama di Story)
        if (!username) {
            const targetUser = await User.findOne({ where: { jid: targetJid } });
            username = targetUser?.name || (targetJid === msgData.senderJid ? msgData.pushName : 'User');
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
            
            // Download dan upload ke CDN biar API lancar
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
                    }
                } catch (e) {
                    console.error('Fake IG Avatar Upload Error:', e.message);
                }
            }

            // Pastikan avatar tidak undefined sebelum masuk params
            if (!avatar) avatar = config.RYZUMI_DEFAULT_PP || 'https://telegra.ph/file/241d7180c0183058f3993.jpg';

            const params = new URLSearchParams({
                username: String(username),
                caption: String(caption),
                avatar: String(avatar)
            });

            const url = `${config.API_RYZUMI}/api/image/fake-story?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('image')) {
                throw new Error('API gagal mereturn gambar');
            }

            await sock.sendMessage(msgData.remoteJid, {
                image: Buffer.from(response.data),
                caption: `Horeee~! Ini dia Fake Story buat Kakak ${msgData.pushName}! Keren kan? (๑>ᴗ<๑)`
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Fake Story Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Aduuh gawat! Ryzumi gagal bikin story-nya kak: ${error.message}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
