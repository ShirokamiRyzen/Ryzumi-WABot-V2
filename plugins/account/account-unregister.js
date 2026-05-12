export default {
    command: ['unregister', 'unreg'],
    category: 'account',
    description: 'Menghapus pendaftaran diri dari database bot',
    isPrivate: true,
    async execute(sock, m, msgData, user) {
        if (!user.is_registered) {
            return msgData.reply('Kamu belum terdaftar sebelumnya!');
        }

        await msgData.db.User.update({ is_registered: false }, { where: { jid: user.jid } });
        await msgData.reply('Pendaftaran berhasil dihapus!');
    }
};
