const plugin = {
    command: ['gc-lock'],
    category: 'group',
    description: 'Mengunci pengeditan info grup (Hanya Admin).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'locked');
            await msgData.reply('Sekarang hanya admin yang bisa edit info grup ini ya, Kakak~ (˶˃ ᵕ ˂˶)');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Ryzumi gagal mengunci info grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
