import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['bapendajabar'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mengecek data pajak kendaraan Jawa Barat',
    async execute(sock, m, msgData) {
        const platInput = msgData.args.join(' ');

        if (!platInput) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cek pajak tapi plat nomornya nggak ada? (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} T1234CD\`\n\nKasih tahu Ryzumi nomor platnya yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/tool/cek-pajak/jabar?plat=${encodeURIComponent(platInput)}`;
            const res = await axios.get(url);
            const result = res.data;

            if (!result || !result.success) {
                const msg = result && result.message ? result.message : 'Datanya nggak ketemu kak..';
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Aduuh gawat! Ryzumi gagal ambil data pajaknya kak.. (╥﹏╥)\n\n*Pesan:* ${msg}\n\nCoba cek lagi plat nomornya yaa~`
                }, { quoted: m });
            }

            const d = result.data;
            const info = d['informasi-umum'] || {};
            const pkb = d['pembayaran-pkb-pnbp'] || {};
            const pkbNon = d['pembayaran-pkb-pnbp-non-program'] || {};
            const pkbInfo = d['informasi-pkb-pnbp'] || {};

            const out = `
📄 *HASIL CEK PAJAK BAPENDA* 📄

• *Nomor Polisi :* \`${info['nomor-polisi'] || '-'}\`
• *Merk / Model :* ${info['merk'] || '-'} / ${info['model'] || '-'}
• *Warna        :* ${info['warna'] || '-'}
• *Jenis        :* ${info['jenis'] || '-'}
• *Tahun Buat   :* ${info['tahun-buatan'] || '-'}

🧾 *Informasi PKB / STNK*
• *Periode      :* ${pkbInfo['dari'] || '-'} → ${pkbInfo['ke'] || '-'}
• *Tgl Pajak    :* ${pkbInfo['tanggal-pajak'] || '-'}
• *Tgl STNK     :* ${pkbInfo['tanggal-stnk'] || '-'}
• *Wilayah      :* ${pkbInfo['wilayah'] || '-'}

💸 *Pembayaran (Program)*
• *PKB Pokok    :* ${pkb['pkb-pokok'] ?? '-'}
• *Opsi PKB     :* ${pkb['opsen-pkb-pokok'] ?? '-'}
• *SWDKLLJ      :* ${pkb['swdkllj-pokok'] ?? '-'}
• *Total        :* \`${pkb['total'] ?? '-'}\`

💸 *Pembayaran (Non-Program)*
• *PKB Pokok    :* ${pkbNon['pkb-pokok'] ?? '-'}
• *Opsi PKB     :* ${pkbNon['opsen-pkb-pokok'] ?? '-'}
• *SWDKLLJ      :* ${pkbNon['swdkllj-pokok'] ?? '-'}
• *Total        :* \`${pkbNon['total'] ?? '-'}\`

⏱️ *Diproses   :* ${d['tanggal-proses'] || '-'}
✔️ *Bisa Bayar :* ${d['canBePaid'] ? 'Bisa dong! (๑>ᴗ<๑)' : 'Belum bisa kak.. (｡T ω T｡)'}

Horeee! Itu tadi data pajak kakak~ Jangan lupa bayar pajak yaa biar berkah! (˶˃ ᵕ ˂˶)
`.trim();

            await sock.sendMessage(msgData.remoteJid, { text: out }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Cek Pajak Jabar Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Ryzumi lagi pusing kak, gagal ambil data pajaknya.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}\n\nCoba lagi nanti yaa kakak~`
            }, { quoted: m });
        }
    }
};
