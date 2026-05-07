import axios from 'axios';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';

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
            const pp = await sock.profilePictureUrl(targetJid, 'image').catch(_ => config.RYZUMI_DEFAULT_PP);

            const url = `${config.API_RYZUMI}/api/image/fake-story?` +
                `username=${encodeURIComponent(username)}` +
                `&caption=${encodeURIComponent(caption)}` +
                `&avatar=${encodeURIComponent(pp)}`;

            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
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
