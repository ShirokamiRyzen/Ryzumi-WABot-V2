const plugin = {
    command: ['gc-reset'],
    category: 'group',
    description: 'Mereset link undangan grup.',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupRevokeInvite(msgData.remoteJid);
            await msgData.reply('Yeay! Link grupnya sudah Ryzumi reset ya, Kakak~ (˶˃ ᵕ ˂˶) .ᐟ.ᐟ');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne Kak... Ryzumi gagal mereset link grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
