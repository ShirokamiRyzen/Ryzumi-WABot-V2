import axios from 'axios';
import fetch from 'node-fetch';
import { ryzumiCDN } from '../../libs/uploader.js';

export default {
    command: ['fakestory', 'fakeig'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan cerita Instagram palsu (Fake Story).',
    async execute(sock, m, msgData, user) {
        const { config, db, quotedContent, args, isQuoted, pushName, remoteJid, senderJid } = msgData;
        
        // Ambil data dari argumen atau quote
        const fullArgs = args.join(' ');
        let [usernameArg, ...captionArgs] = fullArgs.split('|');
        
        let username = usernameArg?.trim();
        let caption = captionArgs.join('|').trim();

        if (!caption && isQuoted) {
            caption = quotedContent;
        }

        if (!caption && usernameArg && !fullArgs.includes('|')) {
            caption = usernameArg;
            username = ''; 
        }

        if (!caption) {
            return msgData.reply(`Kakak manis~ Cara pakainya gini yaa:\n*.fakestory username|caption*\n\nAtau balas pesan teks dengan *.fakestory username*~ (˶˃ ᵕ ˂˶)`);
        }

        // Ambil target JID (default ke pengirim)
        const targetJid = msgData.parseTargetJid() || senderJid;

        // Fallback untuk username
        if (!username) {
            const targetUser = await db.User.findOne({ where: { jid: targetJid } });
            username = targetUser?.name || (targetJid === senderJid ? pushName : 'User');
        }

        await msgData.react('⏳');

        try {
            // Ambil foto profil target dengan Raw Query via msgData (Global)
            const ppUrl = await msgData.getPP(targetJid, 'image');
            
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
                        if (typeof avatar === 'object' && avatar.url) avatar = avatar.url;
                    }
                } catch (e) {
                    console.error('Fake IG Avatar Upload Error:', e.message);
                }
            }

            // Final check untuk avatar
            if (!avatar || avatar === 'undefined') avatar = config.RYZUMI_DEFAULT_PP || 'https://telegra.ph/file/241d7180c0183058f3993.jpg';

            const params = new URLSearchParams({
                username: String(username),
                caption: String(caption),
                avatar: String(avatar)
            });

            const url = `${config.API_RYZUMI}/api/image/fake-story?${params.toString()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            if (response.headers['content-type']?.includes('image')) {
                await sock.sendMessage(remoteJid, {
                    image: Buffer.from(response.data),
                    caption: `Horeee~! Ini dia Fake Story buat Kakak ${pushName}! Keren kan? (๑>ᴗ<๑)`
                }, { quoted: m });
            } else {
                throw new Error('API gagal mereturn gambar');
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('Fake Story Error:', error);
            await msgData.react('❌');
            await msgData.reply(`Aduuh gawat! Ryzumi gagal bikin story-nya kak: ${error.message}.. (╥﹏╥)`);
        }
    }
};
