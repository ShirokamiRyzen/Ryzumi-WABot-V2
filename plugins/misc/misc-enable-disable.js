export default {
    command: ['enable', 'disable', 'on', 'off'],
    category: 'group',
    isAdmin: true,
    description: 'Mengaktifkan atau menonaktifkan fitur bot',
    async execute(sock, m, msgData, _, group) {
        const availableFeatures = ['welcome', 'limit'];
        const feature = msgData.args[0]?.toLowerCase();
        const action = msgData.commandName;
        const status = (action === 'enable' || action === 'on');

        if (!feature || !availableFeatures.includes(feature)) {
            let text = `Uwaaa! Kakak mau setting apa? (๑>ᴗ<๑)\n\nPenggunaan: \`.${action} <fitur>\`\n\n*Daftar fitur:* \n`;
            availableFeatures.forEach(f => text += `• ${f}\n`);
            return sock.sendMessage(msgData.remoteJid, { text: text.trim() }, { quoted: m });
        }

        // Fitur khusus Grup
        if (['welcome', 'limit'].includes(feature)) {
            if (!msgData.isGroup) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Aduuh! Fitur *${feature}* cuma bisa dipake di dalam grup aja kak~ (｡T ω T｡)`
                }, { quoted: m });
            }
        }

        if (feature === 'welcome') {
            await group.update({ is_welcome: status });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Horeee! Fitur *welcome* sekarang sudah Ryzumi ${status ? 'aktifkan' : 'matikan'} buat grup ini yaa~ (˶˃ ᵕ ˂˶)`
            }, { quoted: m });
        } else if (feature === 'limit') {
            await group.update({ is_limited: status });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Selesai kak! Sekarang fitur *limit* di grup ini sudah ${status ? 'aktif' : 'mati'}~ ${status ? 'Sekarang setiap command bakal ngurangin limit lagi yaa.. (｡T ω T｡)' : 'Horeee! Sekarang kakak bebas pakai command apa aja tanpa limit! (๑>ᴗ<๑)'}`
            }, { quoted: m });
        }
    }

};
