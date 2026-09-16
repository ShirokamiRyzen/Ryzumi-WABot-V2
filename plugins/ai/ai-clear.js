import { clearSession } from '../../libs/aiSessionManager.js';
import { getQuoteOption } from '../../libs/aiModels.js';

export default {
    command: ['clearai', 'resetai', 'cleargpt', 'resetgpt'],
    category: 'ai',
    description: 'Menghapus atau mereset riwayat sesi percakapan AI',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        try {
            let sessionKey;
            if (msgData.args[0]) {
                sessionKey = msgData.args[0].trim();
            } else if (msgData.isGroup) {
                const groupNumber = (msgData.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
                sessionKey = `group_${groupNumber}`;
            } else {
                const rawNumber = (msgData.senderJid || m?.sender || '').split('@')[0].replace(/[^0-9]/g, '');
                sessionKey = `user_${rawNumber || 'user'}`;
            }

            const success = clearSession(sessionKey);

            if (success) {
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Riwayat percakapan AI untuk sesi \`${sessionKey}\` di local bot berhasil dibersihkan! (˶˃ ᵕ ˂˶)`
                }, getQuoteOption(msgData, m));
            } else {
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Sesi AI \`${sessionKey}\` tidak ditemukan atau riwayat percakapannya sudah bersih kak~! (๑>ᴗ<๑)`
                }, getQuoteOption(msgData, m));
            }

        } catch (error) {
            console.error('Clear AI Session Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ada masalah saat menghapus sesi AI.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
