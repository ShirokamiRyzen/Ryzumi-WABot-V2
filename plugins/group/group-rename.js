const plugin = {
    command: ['gc-rename'],
    category: 'group',
    description: 'Mengganti nama grup.',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    execute: async (sock, m, msgData) => {
        const newName = msgData.args.join(' ');

        if (!newName) {
            return msgData.reply('Nama grup barunya mana, Kakak~? Masukkan setelah perintah ya! (๑>ᴗ<๑)');
        }

        if (newName.length > 100) {
            return msgData.reply('Aduhh, kepanjangan Kak! Maksimal cuma 100 karakter aja ya~ (╥﹏╥)');
        }

        try {
            await sock.groupUpdateSubject(msgData.remoteJid, newName);
            await msgData.reply(`Selesai! Nama grupnya sekarang sudah ganti jadi "${newName}"~ (˶˃ ᵕ ˂˶)`);
        } catch (error) {
            console.error(error);
            await msgData.reply('Gomen ne... Ryzumi gagal ganti nama grupnya (╥﹏╥)');
        }
    }
};

export default plugin;
