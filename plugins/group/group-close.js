const plugin = {
    command: ['gc-close'],
    category: 'group',
    description: 'Menutup grup (Hanya admin bisa chat).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'announcement');
            await msgData.reply('Sstt! Sekarang hanya admin yang bisa chat di grup ini ya, Kakak~ (๑>ᴗ<๑)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Ryzumi gagal menutup grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
