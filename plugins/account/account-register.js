export default {
    command: ['register', 'daftar'],
    category: 'account',
    description: 'Mendaftarkan diri ke database bot',
    isPrivate: true, // Hanya bisa di chat pribadi
    async execute(sock, m, msgData, user) {
        if (user.is_registered) {
            return msgData.reply('Kamu sudah terdaftar sebelumnya!');
        }

        const name = msgData.args.join(' ') || msgData.pushName || 'User';

        await msgData.db.User.update({ is_registered: true, name: name }, { where: { jid: user.jid } });

        await msgData.reply(`Registrasi berhasil! Selamat datang, ${name}!`);
    }
};
