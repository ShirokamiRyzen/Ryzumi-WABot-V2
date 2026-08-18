import axios from 'axios';
import config from '../../config.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from '../../libs/aiPrompt.js';
import { getQuoteOption } from '../../libs/autoAiHandler.js';
import { getTextModels } from '../../libs/aiModels.js';

export default {
    command: ['grok', 'grokai'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Grok AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        if (sock?.sendPresenceUpdate && msgData?.remoteJid) {
            await sock.sendPresenceUpdate('composing', msgData.remoteJid).catch(() => { });
        }

        let text = msgData.args.join(' ');

        if (msgData.isQuoted && msgData.quotedContent) {
            text = text
                ? `[Pesan yang di-reply]: "${msgData.quotedContent}"\n\n[Pertanyaan/Pesan]: ${text}`
                : msgData.quotedContent;
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Sayangku mau tanya apa sama Grok Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan dengan perintah *.grok <teks>* yaa~! (๑>ᴗ<๑)`
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

            const modelsToTry = await getTextModels({ brandFilter: 'grok' });
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
                    console.warn(`Grok model '${modelName}' failed, attempting fallback...`);
                }
            }

            if (!data || !data.result) {
                throw new Error(lastError?.message || data?.message || data?.error || 'Gagal mendapatkan respon dari Grok AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, getQuoteOption(msgData, m));

        } catch (error) {
            console.error('Grok AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
