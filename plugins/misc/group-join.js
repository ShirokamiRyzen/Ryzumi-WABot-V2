import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';
import config from '../../config.js';

export default {
    command: ['join'],
    category: 'misc',
    isRegistered: true,
    isOwner: true,
    isPremium: true,
    isPrivate: true, // Biar divalidasi otomatis oleh validator.js
    description: 'Bot bergabung ke grup melalui tautan undangan.',
    async execute(sock, m, msgData, user) {
        // Ambil link dari argumen atau dari pesan yang di-reply (quote)
        let text = msgData.args[0];
        if (!text && msgData.isQuoted) {
            text = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
        const match = text.match(linkRegex);

        if (!match) {
            return sock.sendMessage(msgData.remoteJid, { 
                text: 'Umm... sepertinya itu bukan link grup WhatsApp yang valid deh kak.. (´･ᴗ･ ` )' 
            }, { quoted: m });
        }

        const inviteCode = match[1];

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const jid = await sock.groupAcceptInvite(inviteCode);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, { 
                text: `Horeee~! Aku sudah berhasil bergabung ke grup-nya kak! Makasih yaa sudah diundang~ (๑>ᴗ<๑)` 
            }, { quoted: m });

        } catch (error) {
            console.error('Group Join Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            
            let errMsg = 'Aduuh, aku nggak bisa masuk ke grup-nya kak.. (╥﹏╥)';
            if (error.message.includes('410') || error.message.includes('gone')) {
                errMsg = 'Maafin aku kak, aku nggak bisa join karena link-nya sudah kadaluwarsa.. (｡T ω T｡)';
            } else if (error.message.includes('403') || error.message.includes('forbidden')) {
                errMsg = 'Uwaaa! Sepertinya aku pernah dikeluarkan dari grup itu atau link-nya sudah tidak berlaku lagi kak.. (╥﹏╥)';
            }
            
            await sock.sendMessage(msgData.remoteJid, { 
                text: `${errMsg}\n\n*Pesan Error:* ${error.message}` 
            }, { quoted: m });
        }
    }
};
