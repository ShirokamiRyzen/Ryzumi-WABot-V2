const plugin = {
    command: ['gc-link'],
    category: 'group',
    description: 'Mengambil link undangan grup.',
    isGroup: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            const code = await sock.groupInviteCode(msgData.remoteJid);
            const response = `Ini link grupnya, Kakak~ (๑>ᴗ<๑)\n\nhttps://chat.whatsapp.net/${code}`;
            await msgData.reply(response);
        } catch (error) {
            console.error(error);
            await msgData.reply('Aduhh, Ryzumi gagal ambil link grupnya... Gomen ne~ (╥﹏╥)');
        }
    }
};

export default plugin;
