const plugin = {
    command: ['gc-unlock'],
    category: 'group',
    description: 'Membuka pengeditan info grup (Semua Orang).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'unlocked');
            await msgData.reply('Sekarang semua peserta bisa edit info grup ini~ (๑>ᴗ<๑)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Ryzumi gagal membuka info grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
