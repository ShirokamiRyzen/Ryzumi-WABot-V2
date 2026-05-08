import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['pln', 'cekpln'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mengecek tagihan PLN pascabayar',
    async execute(sock, m, msgData) {
        const id = msgData.args[0];

        if (!id) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak lupa masukin ID Pelanggan PLN-nya ya? (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} 1234567890\`\n\nKasih tahu Ryzumi ID-nya yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/tool/cek-pln?id=${id}`;
            const res = await axios.get(url);
            const result = res.data;

            if (!result.success || !result.result) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Aduuh! Ryzumi nggak nemu data tagihan buat ID itu kak.. Mungkin salah ketik? Cek lagi yaa~ (｡T ω T｡)`
                }, { quoted: m });
            }

            const data = result.result;
            const infoText = `
🔌 *HASIL CEK PLN PASCABAYAR* 🔌

• *ID Pelanggan    :* \`${data.customer_id}\`
• *Nama            :* ${data.customer_name}
• *Daya            :* ${data.power_category}
• *Periode         :* ${data.billing_period}
• *Meteran         :* ${data.meter_reading}
• *Tagihan         :* \`${data.outstanding_balance}\`
• *Jumlah Tagihan  :* ${data.total_bills} bulan

Itu tadi tagihan PLN kakak~ Jangan lupa dibayar yaa biar lampunya nggak mati! (๑>ᴗ<๑)
`.trim();

            await sock.sendMessage(msgData.remoteJid, {
                text: infoText,
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Cek PLN Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi ada kendala pas mau cek tagihan PLN-nya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}\n\nCoba lagi nanti yaa kakak~`
            }, { quoted: m });
        }
    }
};
