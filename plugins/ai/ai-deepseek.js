import axios from 'axios';
import config from '../../config.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from '../../libs/aiPrompt.js';

export default {
    command: ['deepseek', 'deepseekai', 'ds'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan DeepSeek AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        let text = msgData.args.join(' ');

        if (!text && msgData.isQuoted && msgData.quotedContent) {
            text = msgData.quotedContent;
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Sayangku mau tanya apa sama DeepSeek Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan dengan perintah *.deepseek <teks>* yaa~! (๑>ᴗ<๑)`
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
            const prompt = RYZUMI_AI_SYSTEM_PROMPT;

            const modelsToTry = ['deepseek-v4-pro', 'deepseek-v4-mod'];
            let data = null;
            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    const payload = {
                        text: text,
                        model: modelName,
                        prompt: prompt,
                        session: session
                    };

                    const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/text-model`, payload);
                    if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                        data = res.data;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`DeepSeek model '${modelName}' failed, attempting fallback...`);
                }
            }

            if (!data || !data.result) {
                throw new Error(lastError?.message || data?.message || data?.error || 'Gagal mendapatkan respon dari DeepSeek AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, { quoted: m });

        } catch (error) {
            console.error('DeepSeek AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
