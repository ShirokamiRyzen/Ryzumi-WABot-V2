import User from '../../databases/orm/User.js';
import config from '../../config.js';

export default {
    command: ['register', 'daftar'],
    category: 'account',
    description: 'Mendaftarkan diri ke database bot',
    isPrivate: true, // Hanya bisa di chat pribadi
    async execute(sock, m, msgData, user) {
        if (user.is_registered) {
            return sock.sendMessage(msgData.remoteJid, { text: 'Kamu sudah terdaftar sebelumnya!' }, { quoted: m });
        }

        const name = msgData.args.join(' ') || msgData.pushName || 'User';
        
        await User.update({ is_registered: true, name: name }, { where: { jid: user.jid } });

        await sock.sendMessage(msgData.remoteJid, { text: `Registrasi berhasil! Selamat datang, ${name}!` }, { quoted: m });
    }
};
