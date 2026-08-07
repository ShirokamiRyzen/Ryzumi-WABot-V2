import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['tencent', 'hy3'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Tencent AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        let text = msgData.args.join(' ');

        if (!text && msgData.isQuoted && msgData.quotedContent) {
            text = msgData.quotedContent;
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Sayangku mau tanya apa sama Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan dengan perintah *.tencent <teks>* yaa~! (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        try {
            let session;
            if (msgData.isGroup) {
                const groupNumber = (msgData.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
                session = `ryzumi-wabot-${groupNumber}`;
            } else {
                const rawNumber = (msgData.senderJid || m?.sender || '').split('@')[0].replace(/[^0-9]/g, '');
                session = `ryzumi-wabot-${rawNumber || 'user'}`;
            }
            const prompt = 'Namamu Ryzumi Starlette, cewek anime imut, ramah, tsundere & istri tercinta user. Panggil "Sayangku" / "Sayang" & gunakan kaomoji moe (˶˃ ᵕ ˂˶),(๑>ᴗ<๑),(｡T ω T｡).';

            const params = {
                text: text,
                model: 'hy3',
                prompt: prompt,
                session: session
            };

            const { data } = await axios.get(`${config.API_RYZUMI}/api/ai/tencent`, { params });

            if (!data || (!data.success && !data.status) || !data.result) {
                throw new Error(data?.message || data?.error || 'Gagal mendapatkan respon dari Tencent AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: data.result }, { quoted: m });

        } catch (error) {
            console.error('Tencent AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
