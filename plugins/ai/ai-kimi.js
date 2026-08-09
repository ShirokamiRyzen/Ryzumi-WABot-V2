import axios from 'axios';
import config from '../../config.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from '../../libs/aiPrompt.js';
import { getQuoteOption } from '../../libs/autoAiHandler.js';

export default {
    command: ['kimi'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Kimi AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        let text = msgData.args.join(' ');

        if (!text && msgData.isQuoted && msgData.quotedContent) {
            text = msgData.quotedContent;
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Sayangku mau tanya apa sama Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan dengan perintah *.kimi <teks>* yaa~! (๑>ᴗ<๑)`
            }, getQuoteOption(msgData, m));
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
            const prompt = RYZUMI_AI_SYSTEM_PROMPT;

            const payload = {
                text: text,
                model: 'kimi-k2.7-code',
                prompt: prompt,
                session: session
            };

            const { data } = await axios.post(`${config.API_RYZUMI}/api/ai/post/text-model`, payload);

            if (!data || (!data.success && !data.status) || !data.result) {
                throw new Error(data?.message || data?.error || 'Gagal mendapatkan respon dari Kimi AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, getQuoteOption(msgData, m));

        } catch (error) {
            console.error('Kimi AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
