import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['mahasiswa', 'pddikti'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari data mahasiswa di PDDIKTI',
    async execute(sock, m, msgData) {
        const text = msgData.args.join(' ');

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari mahasiswa siapa? Kasih tahu Ryzumi nama atau NIM-nya yaa~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} Budi Utomo\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/search/mahasiswa?query=${encodeURIComponent(text)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!Array.isArray(data) || data.length === 0) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, data mahasiswa "${text}" nggak ketemu di PDDIKTI.. (｡T ω T｡)`
                }, { quoted: m });
            }

            let message = `🔍 *HASIL PENCARIAN MAHASISWA* 🔍\n\nHasil untuk: "${text}"\n\n`;

            data.forEach((mahasiswa, index) => {
                const nama = mahasiswa.nama || '-';
                const nim = mahasiswa.nim || '-';
                const namaPt = mahasiswa.nama_pt || '-';
                const namaProdi = mahasiswa.nama_prodi || '-';

                message += `${index + 1}. *Nama:* ${nama}\n   *NIM:* ${nim}\n   *PT:* ${namaPt}\n   *Prodi:* ${namaProdi}\n\n`;
            });

            message += `Horeee! Itu tadi data yang Ryzumi temukan kak~ (๑>ᴗ<๑)`;

            await sock.sendMessage(msgData.remoteJid, {
                text: message.trim(),
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('PDDIKTI Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal cari data mahasiswanya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
