import axios from 'axios';
import config from '../../config.js';
import { ryzumiCDN } from '../../libs/uploader.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from '../../libs/aiPrompt.js';
import { getQuoteOption } from '../../libs/autoAiHandler.js';
import { getVisionModels, getTextModels } from '../../libs/aiModels.js';

export default {
    command: ['chatgpt', 'gpt'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan AI ChatGPT (Ryzumi Starlette)',
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
                    text: `Uwaaa! Sayangku mau tanya apa sama Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan atau kirim/balas gambar dengan perintah *.chatgpt <teks>* yaa~! (๑>ᴗ<๑)`
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
            const visionModels = await getVisionModels({ allowClaude: false, prioritizeLuna: true });
            const textModels = await getTextModels({ allowClaude: false, brandFilter: 'gpt' });

            let data = null;
            let lastError = null;

            if (imageUrl) {
                for (const modelName of visionModels) {
                    try {
                        const payload = {
                            text: text,
                            model: modelName,
                            prompt: prompt,
                            session: session,
                            image: imageUrl
                        };
                        const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/vision-model`, payload, { timeout: 15000 });
                        if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                            data = res.data;
                            break;
                        }
                    } catch (err) {
                        lastError = err;
                        console.warn(`ChatGPT vision model '${modelName}' failed, attempting fallback...`);
                    }
                }
            }

            if (!data || !data.result) {
                const textInput = imageUrl ? `[Lampiran Media: User melampirkan gambar/foto]\n\n[Pertanyaan/Pesan]: ${text}` : text;
                for (const modelName of textModels) {
                    try {
                        const payload = {
                            text: textInput,
                            model: modelName,
                            prompt: prompt,
                            session: session
                        };
                        const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/text-model`, payload, { timeout: 15000 });
                        if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                            data = res.data;
                            break;
                        }
                    } catch (err) {
                        lastError = err;
                        console.warn(`ChatGPT text model '${modelName}' failed, attempting fallback...`);
                    }
                }
            }

            if (!data || !data.result) {
                throw new Error(lastError?.message || data?.message || data?.error || 'Gagal mendapatkan respon dari AI.. (╥﹏╥)');
            }

            await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, getQuoteOption(msgData, m));

        } catch (error) {
            console.error('ChatGPT AI Plugin Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
