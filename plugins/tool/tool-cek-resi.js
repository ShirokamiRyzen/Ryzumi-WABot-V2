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
        const ekspedisi = msgData.args[1] || '';

        if (!noResi) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak lupa masukin nomor resinya ya? (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} SPXID054330680586 shopee-express\`\n\nJangan lupa kasih tau Ryzumi nomornya yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        const ekspedisiList = {
            'acommerce': 'ACOMMERCE',
            'anter-aja': 'ANTERAJA',
            'ark-xpress': 'ARK',
            'grab-express': 'GRAB',
            'gtl-goto-logistics': 'GTL',
            'indah-logistik-cargo': 'INDAH',
            'janio-asia': 'JANIO',
            'jet-express': 'JETEXPRESS',
            'lion-parcel': 'LIONPARCEL',
            'luar-negeri-bea-cukai': 'BEACUKAI',
            'lazada-express-lex': 'LEX',
            'lazada-logistics': 'LEL',
            'ninja': 'NINJA',
            'nss-express': 'NSS',
            'paxel': 'PAXEL',
            'pcp-express': 'PCP',
            'pos-indonesia': 'POS',
            'pt-ncs': 'NCS',
            'qrim-express': 'QRIM',
            'rcl-red-carpet-logistics': 'RCL',
            'sap-express': 'SAP',
            'shopee-express': 'SPX',
            'standard-express-lwe': 'LWE',
            'tiki': 'TIKI',
        };

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/tool/cek-resi?resi=${noResi}${ekspedisi ? `&ekspedisi=${ekspedisi}` : ''}`;
            const res = await axios.get(url);
            const result = res.data;

            if (!result.success || !result.data) {
                if (!ekspedisi) {
                    const available = Object.keys(ekspedisiList).join('\n• ');
                    return sock.sendMessage(msgData.remoteJid, {
                        text: `Aduuh, Ryzumi gagal deteksi ekspedisinya kak.. (╥﹏╥)\nCoba kakak sertakan nama ekspedisinya secara manual yaa~\n\n*Contoh:* \`.cekresi ${noResi} shopee-express\`\n\n*List Ekspedisi:* \n• ${available}\n\nSemangat nunggu paketnya kak! (๑>ᴗ<๑)`
                    }, { quoted: m });
                } else {
                    return sock.sendMessage(msgData.remoteJid, {
                        text: `Uwaaa! Ryzumi nggak nemu resinya kak.. Mungkin nomor atau ekspedisinya salah? Cek lagi yaa~ (｡T ω T｡)`
                    }, { quoted: m });
                }
            }

            const data = result.data;
            const historyText = data.history?.slice(0, 5).map((item) => `• *${item.tanggal}*\n  ${item.keterangan}`).join('\n\n') || 'Belum ada histori nih kak..';

            const infoText = `
📦 *HASIL PELACAKAN RESI* 📦

No Resi        : \`${data.resi}\`
Ekspedisi      : ${data.ekspedisi}
Status         : ${data.status}
Tgl Kirim      : ${data.tanggalKirim || '-'}
Posisi Akhir   : ${data.lastPosition || '-'}
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
            const available = Object.keys(ekspedisiList).join('\n• ');
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi ada masalah pas mau cek resinya kak.. (╥﹏╥)\n\nKalau kakak mau coba lagi, pastiin formatnya bener ya:\n\`.cekresi ${noResi || '[nomor]'} [ekspedisi]\`\n\n*List Ekspedisi:* \n• ${available}`
            }, { quoted: m });
        }
    }
};
