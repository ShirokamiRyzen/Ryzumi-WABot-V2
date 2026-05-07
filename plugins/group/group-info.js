export default {
    command: ['gc-info', 'info-gc'],
    category: 'group',
    isGroup: true, // Memastikan hanya bisa dijalankan di grup
    description: 'Menampilkan informasi dari grup saat ini.',
    async execute(sock, m, msgData) {
        try {
            // Ambil metadata grup dari Baileys
            const groupMetadata = await sock.groupMetadata(msgData.remoteJid);
            const { subject, desc, participants, creation } = groupMetadata;

            const createdDate = new Date(creation * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            const participantCount = participants.length;
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

            let text = `--- INFORMASI GRUP ---\n\n`;
            text += `Nama: ${subject}\n`;
            text += `Dibuat Pada: ${createdDate} WIB\n`;
            text += `Jumlah Anggota: ${participantCount}\n`;
            text += `Jumlah Admin: ${admins.length}\n`;

            if (desc) {
                text += `\nDeskripsi:\n${desc.toString()}\n`;
            }

            await sock.sendMessage(msgData.remoteJid, { text }, { quoted: m });
        } catch (error) {
            console.error('Gagal mengambil metadata grup:', error);
            await sock.sendMessage(msgData.remoteJid, { text: 'Gagal mengambil informasi grup. Pastikan bot adalah anggota dari grup ini.' }, { quoted: m });
        }
    }
};
