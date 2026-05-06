import User from '../../databases/orm/User.js';
import config from '../../config.js';

export default {
    command: ['unregister', 'unreg'],
    category: 'account',
    description: 'Menghapus pendaftaran diri dari database bot',
    isPrivate: true, // Hanya bisa di chat pribadi
    async execute(sock, m, msgData, user) {
        if (!user.is_registered) {
            return sock.sendMessage(msgData.remoteJid, { text: 'Kamu belum terdaftar di database kami.' }, { quoted: m });
        }

        await User.update({ is_registered: false }, { where: { jid: user.jid } });

        await sock.sendMessage(msgData.remoteJid, { text: 'Pendaftaranmu telah dibatalkan. Terima kasih!' }, { quoted: m });
    }
};
