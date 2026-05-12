export default {
    command: ['join'],
    category: 'group',
    isRegistered: true,
    isOwner: true,
    isPremium: true,
    isPrivate: true,
    description: 'Bot bergabung ke grup melalui tautan undangan.',
    async execute(sock, m, msgData) {
        const { config, quotedContent, args, isQuoted } = msgData;

        let text = args[0];
        if (!text && isQuoted) {
            text = quotedContent;
        }

        if (!text) {
            return msgData.reply(config.RYZUMI_MSG_QUOTED);
        }

        const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
        const match = text.match(linkRegex);

        if (!match) {
            return msgData.reply('Umm... sepertinya itu bukan link grup WhatsApp yang valid deh kak.. (´･ᴗ･ ` )');
        }

        const inviteCode = match[1];

        try {
            await sock.groupAcceptInvite(inviteCode);
            await msgData.reply(`Horeee~! Aku sudah berhasil bergabung ke grup-nya kak! Makasih yaa sudah diundang~ (๑>ᴗ<๑)`);

        } catch (error) {
            console.error('Group Join Error:', error);

            let errMsg = 'Aduuh, aku nggak bisa masuk ke grup-nya kak.. (╥﹏╥)';
            if (error.message.includes('410') || error.message.includes('gone')) {
                errMsg = 'Maafin aku kak, aku nggak bisa join karena link-nya sudah kadaluwarsa.. (｡T ω T｡)';
            } else if (error.message.includes('403') || error.message.includes('forbidden')) {
                errMsg = 'Uwaaa! Sepertinya aku pernah dikeluarkan dari grup itu atau link-nya sudah tidak berlaku lagi kak.. (╥﹏╥)';
            }

            await msgData.reply(`${errMsg}\n\n*Pesan Error:* ${error.message}`);
        }
    }
};
