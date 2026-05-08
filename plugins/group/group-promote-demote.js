export default {
    command: ['promote', 'demote'],
    category: 'group',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    description: 'Menaikkan atau menurunkan jabatan anggota grup',
    async execute(sock, m, msgData) {
        // Ambil JID target dari mention atau reply
        let users = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            users.push(m.message.extendedTextMessage.contextInfo.participant);
        }

        // Hapus duplikasi JID
        users = [...new Set(users)];

        if (users.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Tag atau balas pesan user yang ingin di-${msgData.commandName}` }, { quoted: m });
        }

        const action = msgData.commandName; // 'promote' atau 'demote'
        
        try {
            await sock.groupParticipantsUpdate(msgData.remoteJid, users, action);
            
            const actionText = action === 'promote' ? 'dinaikkan menjadi Admin' : 'diturunkan jabatannya';
            const mentions = users;
            const text = users.map(u => `@${u.split('@')[0]}`).join(', ') + ` berhasil ${actionText}`;

            await sock.sendMessage(msgData.remoteJid, { text, mentions }, { quoted: m });
        } catch (error) {
            console.error(`${action} Error:`, error);
            await sock.sendMessage(msgData.remoteJid, { text: `Gagal melakukan ${action}: ${error.message}` }, { quoted: m });
        }
    }
};
