import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['am', 'alight', 'alightactivator', 'amactivator'],
    category: 'tool',
    isRegistered: true,
    limit: 5,
    description: 'Aktivasi akun Alight Motion Premium',
    async execute(sock, m, msgData) {
        const args = msgData.args;
        const email = args[0];
        const rawLink = args[1] ? args.slice(1).join(' ') : null;

        if (!email) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak lupa masukin email Alight Motion-nya ya? (｡T ω T｡)\n\n*Cara Penggunaan:*\n1. Kirim Link Aktivasi:\n\`.${msgData.commandName} user@gmail.com\`\n\n2. Verifikasi Link:\n\`.${msgData.commandName} user@gmail.com https://link-verification-url\``
            }, { quoted: m });
        }

        // Validasi format email dasar
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Format email yang kakak masukin sepertinya kurang tepat deh.. (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} user@gmail.com\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            let url = `${config.API_RYZUMI}/api/tool/alight-activator?email=${encodeURIComponent(email)}`;
            if (rawLink) {
                url += `&link=${encodeURIComponent(rawLink)}`;
            }

            const response = await axios.get(url);
            const result = response.data;

            if (!result || result.success === false) {
                const errMsg = result?.error || result?.message || result?.msg || 'Gagal melakukan aktivasi akun.';
                await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Aduuh gawat! Ryzumi gagal memproses aktivasi Alight Motion kak.. (╥﹏╥)\n\n*Email:* \`${email}\`\n*Pesan Error:* ${errMsg}`
                }, { quoted: m });
            }

            const data = result.data || result.result || result;
            const message = data.message || result.message || 'Berhasil diproses!';
            const orderCode = data.orderCode || result.orderCode;
            const duration = data.duration || result.duration;
            const isPremium = data.premium !== undefined ? data.premium : result.premium;
            const instructions = data.instructions || result.instructions;
            const accountLinkStatus = result.accountLinkStatus || data.accountLinkStatus;
            const expiryTimeMillis = result.expiryTimeMillis || data.expiryTimeMillis;
            const autoRenewing = result.autoRenewing !== undefined ? result.autoRenewing : data.autoRenewing;

            let extraInfo = '';
            if (orderCode) extraInfo += `\n• *Order Code:* \`${orderCode}\``;
            if (duration) extraInfo += `\n• *Durasi Premium:* ${duration}`;
            if (isPremium !== undefined) extraInfo += `\n• *Status Premium:* ${isPremium ? 'Aktif! (˶˃ ᵕ ˂˶)' : 'Tidak'}`;
            if (accountLinkStatus) extraInfo += `\n• *Link Status:* ${accountLinkStatus}`;
            if (expiryTimeMillis) {
                const expiryDate = new Date(parseInt(expiryTimeMillis, 10));
                if (!isNaN(expiryDate.getTime())) {
                    extraInfo += `\n• *Expired:* ${expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                }
            }
            if (autoRenewing !== undefined) extraInfo += `\n• *Auto Renew:* ${autoRenewing ? 'Ya' : 'Tidak'}`;

            let instructionsText = '';
            if (Array.isArray(instructions) && instructions.length > 0) {
                instructionsText = `\n\n📌 *INSTRUKSI LANGKAH SELANJUTNYA:*\n` + instructions.map((ins, i) => `${i + 1}. ${ins}`).join('\n');
            } else if (typeof instructions === 'string' && instructions) {
                instructionsText = `\n\n📌 *INSTRUKSI:* ${instructions}`;
            }

            const captionText = `
✨ *ALIGHT MOTION ACTIVATOR* ✨

• *Email:* \`${email}\`
• *Status:* ${message}${extraInfo}${instructionsText}

Horeee! Silakan ikuti petunjuk di atas yaa kak~ (๑>ᴗ<๑)
`.trim();

            await sock.sendMessage(msgData.remoteJid, {
                text: captionText
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Alight Motion Activator Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Internal Server Error';
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi ada masalah pas mau aktivasi akun Alight Motion kak.. (╥﹏╥)\n\n*Error:* ${errMsg}\n\nCoba lagi nanti yaa kakak~`
            }, { quoted: m });
        }
    }
};
