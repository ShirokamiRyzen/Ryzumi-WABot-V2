import axios from 'axios';
import config from '../../config.js';
import { ryzumiCDN } from '../../libs/uploader.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from '../../libs/aiPrompt.js';
import { getQuoteOption } from '../../libs/autoAiHandler.js';
import { getVisionModels, getTextModels } from '../../libs/aiModels.js';

export default {
    command: ['claude', 'anthropic', 'sonnet', 'opus'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Claude AI (Ryzumi Starlette)',
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

            if (!text && imageUrl) {
                text = 'Jelaskan gambar ini';
            }

            if (!text) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Uwaaa! Sayangku mau tanya apa sama Claude Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan atau kirim/balas gambar dengan perintah *.claude <teks>* yaa~! (๑>ᴗ<๑)`
                }, getQuoteOption(msgData, m));
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

            const visionModels = await getVisionModels({ allowClaude: true });
            const textModels = await getTextModels({ allowClaude: true, brandFilter: 'claude' });
            const modelsToTry = imageUrl ? visionModels.filter(m => /claude/i.test(m)) : textModels;
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

                    if (imageUrl) {
                        payload.image = imageUrl;
                    }

                    const endpoint = imageUrl ? `${config.API_RYZUMI}/api/ai/post/vision-model` : `${config.API_RYZUMI}/api/ai/post/text-model`;
                    const res = await axios.post(endpoint, payload);
                    if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                        data = res.data;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`Claude model '${modelName}' failed, attempting fallback...`);
                }
            }

            if (!data || !data.result) {
                throw new Error(lastError?.message || data?.message || data?.error || 'Gagal mendapatkan respon dari Claude AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, getQuoteOption(msgData, m));

        } catch (error) {
            console.error('Claude AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
