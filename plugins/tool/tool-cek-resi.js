import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['resi', 'cekresi'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Melacak status pengiriman paket',
    async execute(sock, m, msgData) {
        const noResi = msgData.args[0];

        if (!noResi) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak lupa masukin nomor resinya ya? (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} SPXID067020403716\`\n\nJangan lupa kasih tau Ryzumi nomornya yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/tool/cek-resi?resi=${noResi}`;
            const res = await axios.get(url);
            const result = res.data;

            const data = result.success ? result.data : result;

            if (!data || (!data.resi && !data.noResi)) {
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Uwaaa! Ryzumi nggak nemu resinya kak.. Coba cek lagi yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const history = data.history || data.riwayat || [];
            const historyText = history.slice(0, 5).map((item) => `• *${item.tanggal || item.date}*\n  ${item.keterangan || item.desc || item.note}`).join('\n\n') || 'Belum ada histori nih kak..';

            const infoText = `
📦 *HASIL PELACAKAN RESI* 📦

No Resi        : \`${data.resi || data.noResi}\`
Ekspedisi      : ${data.ekspedisi || data.expedisi || '-'}
Status         : ${data.status || '-'}
Tgl Kirim      : ${data.tanggalKirim || '-'}
Posisi Akhir   : ${data.lastPosition || data.posisiTerakhir || '-'}
CS             : ${data.customerService || '-'}

🕓 *5 Riwayat Terbaru:*
${historyText}

Horeee! Itu tadi status paket kakak~ Semoga cepet sampe yaa! (๑>ᴗ<๑)
`.trim();

            await sock.sendMessage(msgData.remoteJid, {
                text: infoText,
            }, { quoted: m });

            // Reaksi sukses~
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Cek Resi Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi ada masalah pas mau cek resinya kak.. (╥﹏╥)\n\nCoba lagi nanti yaa~`
            }, { quoted: m });
        }
    }
};
