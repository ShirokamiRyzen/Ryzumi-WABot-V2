import axios from 'axios';
import config from '../../config.js';
import { ryzumiCDN } from '../../libs/uploader.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from '../../libs/aiPrompt.js';

export default {
    command: ['chatgpt', 'gpt'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan AI ChatGPT (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        let text = msgData.args.join(' ');

        if (!text && msgData.isQuoted && msgData.quotedContent) {
            text = msgData.quotedContent;
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Sayangku mau tanya apa sama Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan atau kirim/balas gambar dengan perintah *.chatgpt <teks>* yaa~! (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        try {
            let imageUrl = null;
            const isMediaImage = msgData.isMedia && /image/i.test(msgData.mime);
            const isQuotedImage = msgData.isQuotedMedia && /image/i.test(msgData.quotedMime);

            if (isMediaImage || isQuotedImage) {
                const buffer = await msgData.downloadMedia();
                if (buffer) {
                    const cdnRes = await ryzumiCDN(buffer);
                    imageUrl = cdnRes?.url || cdnRes?.result?.url || (typeof cdnRes?.result === 'string' ? cdnRes.result : null);
                }
            }

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
                model: 'gpt-5.6-luna',
                prompt: prompt,
                session: session
            };

            if (imageUrl) {
                payload.image = imageUrl;
            }

            const { data } = await axios.post(`${config.API_RYZUMI}/api/ai/post/vision-model`, payload);

            if (!data || (!data.success && !data.status) || !data.result) {
                throw new Error(data?.message || data?.error || 'Gagal mendapatkan respon dari AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, { quoted: m });

        } catch (error) {
            console.error('ChatGPT AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
