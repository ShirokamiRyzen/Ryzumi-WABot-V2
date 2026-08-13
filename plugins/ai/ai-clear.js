import axios from 'axios';
import config from '../../config.js';
import { getQuoteOption } from '../../libs/autoAiHandler.js';

export default {
    command: ['clearai', 'resetai', 'cleargpt', 'resetgpt'],
    category: 'ai',
    description: 'Menghapus atau mereset riwayat sesi percakapan AI',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        try {
            let session;
            if (msgData.args[0]) {
                session = msgData.args[0].trim();
            } else if (msgData.isGroup) {
                const groupNumber = (msgData.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
                session = `ryzumi-wabot-${groupNumber}`;
            } else {
                const rawNumber = (msgData.senderJid || m?.sender || '').split('@')[0].replace(/[^0-9]/g, '');
                session = `ryzumi-wabot-${rawNumber || 'user'}`;
            }

            const res = await axios.get(`${config.API_RYZUMI}/api/misc/clear-ai-session`, {
                params: { session }
            });

            if (res.data && res.data.status) {
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Riwayat percakapan AI untuk sesi \`${session}\` berhasil dibersihkan! (˶˃ ᵕ ˂˶)`
                }, getQuoteOption(msgData, m));
            } else {
                await sock.sendMessage(msgData.remoteJid, {
                    text: res.data?.message || `Sesi AI \`${session}\` tidak ditemukan atau sudah bersih~! (๑>ᴗ<๑)`
                }, getQuoteOption(msgData, m));
            }

        } catch (error) {
            console.error('Clear AI Session Error:', error);
            const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Internal Server Error';
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ada masalah saat menghapus sesi AI.. (╥﹏╥)\n\n*Error:* ${errorMsg}`
            }, { quoted: m });
        }
    }
};
