import Group from '../../databases/orm/Group.js';
import config from '../../config.js';

export default {
    command: ['enable', 'disable', 'on', 'off'],
    category: 'group',
    isGroup: true,
    isAdmin: true,
    description: 'Mengaktifkan atau menonaktifkan fitur grup',
    async execute(sock, m, msgData, user) {
        const availableFeatures = ['welcome'];
        const feature = msgData.args[0]?.toLowerCase();
        const action = msgData.commandName;
        const status = (action === 'enable' || action === 'on');

        if (!feature || !availableFeatures.includes(feature)) {
            let text = `Penggunaan: .${action} <fitur>\n\nDaftar fitur tersedia:\n`;
            availableFeatures.forEach(f => text += `- ${f}\n`);
            return sock.sendMessage(msgData.remoteJid, { text: text.trim() }, { quoted: m });
        }

        if (feature === 'welcome') {
            await Group.upsert({
                jid: msgData.remoteJid,
                is_welcome: status
            });
            await sock.sendMessage(msgData.remoteJid, { text: `Fitur ${feature} berhasil di${status ? 'aktifkan' : 'matikan'}` }, { quoted: m });
        }
    }
};
