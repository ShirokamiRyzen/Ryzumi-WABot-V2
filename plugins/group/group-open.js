const plugin = {
    command: ['gc-open'],
    category: 'group',
    description: 'Membuka grup (Semua orang bisa chat).',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        try {
            await sock.groupSettingUpdate(msgData.remoteJid, 'not_announcement');
            await msgData.reply('Yeay! Grupnya sudah dibuka, sekarang semua bisa chat lagi deh~ (˶˃ ᵕ ˂˶) .ᐟ.ᐟ');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Ryzumi gagal membuka grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
