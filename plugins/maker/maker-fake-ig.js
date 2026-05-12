import axios from 'axios';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['fakestory', 'fakeig'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan cerita Instagram palsu (Fake Story).',
    async execute(sock, m, msgData, user) {
        // Ambil data dari argumen atau quote
        let [usernameArg, ...captionArgs] = msgData.args.join(' ').split('|');
        let caption = captionArgs.join('|').trim();
        let username = usernameArg?.trim();

        // Fallback untuk caption dari quoted message
        if (!caption && msgData.isQuoted) {
            caption = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        if (!caption) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Kakak manis~ Cara pakainya gini yaa:\n*.fakestory username|caption*\n\nAtau balas pesan teks dengan *.fakestory username*~ (˶˃ ᵕ ˂˶)`
            }, { quoted: m });
        }

        // Ambil target untuk avatar (default ke pengirim)
        const targetJid = msgData.parseTargetJid() || msgData.senderJid;

        // Fallback untuk username jika tidak diisi
        if (!username) {
            const targetUser = await User.findOne({ where: { jid: targetJid } });
            username = targetUser?.name || msgData.pushName || 'RyzumiUser';
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            // Ambil foto profil target
            let ppUrl = config.RYZUMI_DEFAULT_PP;
            try {
                // Bersihkan JID dari device index (:1, :2 dst) agar profilePictureUrl lancar
                const cleanJid = targetJid.split(':')[0].split('@')[0] + (targetJid.includes('@lid') ? '@lid' : '@s.whatsapp.net');
                const waPp = await sock.profilePictureUrl(cleanJid, 'image');
                if (waPp) ppUrl = waPp;
            } catch (e) {
                console.error('Failed to get WA PP:', e.message);
            }
            
            // Download dan upload ke CDN biar API lancar (karena kadang API gagal ambil langsung dari WA)
            let avatar = ppUrl;
            if (ppUrl && typeof ppUrl === 'string' && ppUrl.startsWith('http')) {
                try {
                    const ppResponse = await axios.get(ppUrl, { 
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    const uploadResult = await ryzumiCDN(Buffer.from(ppResponse.data));
                    avatar = uploadResult.url;
                } catch (e) {
                    console.error('Fake IG CDN Upload Error:', e);
                }
            }

            const params = new URLSearchParams({
                username: username,
                caption: caption,
                avatar: avatar
            });

            const url = `${config.API_RYZUMI}/api/image/fake-story?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });

            // Cek apakah responnya beneran gambar
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

            const buffer = Buffer.from(response.data);

            await sock.sendMessage(msgData.remoteJid, {
                image: buffer,
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
