const plugin = {
    command: ['gc-desc'],
    category: 'group',
    description: 'Mengganti deskripsi grup.',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        const newDesc = msgData.args.join(' ');

        if (!newDesc) {
            return msgData.reply('Deskripsi barunya mana, Kakak~? Masukkan setelah perintah ya! (๑>ᴗ<๑)');
        }

        try {
            await sock.groupUpdateDescription(msgData.remoteJid, newDesc);
            await msgData.reply('Yeay! Deskripsi grupnya sudah berhasil Ryzumi ganti~ (˶˃ ᵕ ˂˶) .ᐟ.ᐟ');
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Ryzumi gagal ganti deskripsi grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
