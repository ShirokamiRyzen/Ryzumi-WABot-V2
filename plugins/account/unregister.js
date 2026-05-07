import User from '../../databases/orm/User.js';

export default {
    command: ['unregister', 'unreg'],
    category: 'account',
    description: 'Menghapus pendaftaran diri dari database bot',
    isPrivate: true,
    async execute(sock, m, msgData, user) {
        if (!user.is_registered) {
            return sock.sendMessage(msgData.remoteJid, { text: 'Kamu belum terdaftar sebelumnya!' }, { quoted: m });
        }

        await User.update({ is_registered: false }, { where: { jid: user.jid } });
        await sock.sendMessage(msgData.remoteJid, { text: 'Pendaftaran berhasil dihapus!' }, { quoted: m });
    }
};
