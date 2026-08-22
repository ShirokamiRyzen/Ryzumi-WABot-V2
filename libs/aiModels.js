import axios from 'axios';
import sharp from 'sharp';
import config from '../config.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from './aiPrompt.js';

let cachedModels = null;
let lastFetchTime = 0;
const CACHE_TTL = 15000; // 15 seconds cache to stay reactive to dynamic proxy model updates

/**
 * Compress an image buffer and return a base64 Data URL (data:image/jpeg;base64,...).
 * Resizes large dimensions and optimizes JPEG quality to ensure minimal payload size.
 * @param {Buffer} buffer 
 * @param {Object} options
 * @param {number} options.maxDimension
 * @param {number} options.quality
 * @returns {Promise<string|null>}
 */
export async function compressImageToBase64(buffer, { maxDimension = 1024, quality = 75 } = {}) {
    if (!buffer || !Buffer.isBuffer(buffer)) return null;
    try {
        const compressedBuffer = await sharp(buffer)
            .rotate() // auto-orient based on EXIF
            .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality, progressive: true })
            .toBuffer();
        return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    } catch (err) {
        console.warn('Image compression with sharp failed, fallback to raw base64:', err.message);
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
}

/**
 * Fetch models dynamically from Ryzumi API / Proxy
 * @param {boolean} forceRefresh 
 * @returns {Promise<Array>}
 */
export async function fetchAiModels(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedModels && (now - lastFetchTime < CACHE_TTL)) {
        return cachedModels;
    }

    try {
        const res = await axios.get(`${config.API_RYZUMI}/api/ai/models`, { timeout: 10000 });
        let list = null;
        if (res?.data?.data && Array.isArray(res.data.data)) {
            list = res.data.data;
        } else if (Array.isArray(res?.data)) {
            list = res.data;
        }

        if (list && list.length > 0) {
            cachedModels = list;
            lastFetchTime = now;
            return cachedModels;
        }
    } catch (err) {
        console.warn('Failed to fetch AI models from API_RYZUMI:', err.message);
    }

    return cachedModels || [];
}

/**
 * Check if a model is vision capable
 * @param {Object} model 
 * @returns {boolean}
 */
export function isVisionModel(model) {
    if (!model) return false;
    return model.vision === true || Boolean(model.modalities?.input?.includes('image'));
}

/**
 * Helper to build regex for brand filtering
 * @param {string} brand 
 * @returns {RegExp|null}
 */
export function getBrandRegex(brand) {
    if (!brand) return null;
    const b = brand.toLowerCase().trim();
    if (b.includes('tencent') || b.includes('hy3') || b.includes('hunyuan')) return /(tencent|hy3|hunyuan)/i;
    if (b.includes('gpt') || b.includes('chatgpt') || b.includes('openai')) return /(gpt|chatgpt|openai)/i;
    if (b.includes('claude') || b.includes('anthropic') || b.includes('sonnet') || b.includes('opus')) return /(claude|anthropic|sonnet|opus)/i;
    if (b.includes('mimo') || b.includes('xiaomi')) return /(mimo|xiaomi)/i;
    if (b.includes('gemini') || b.includes('google')) return /(gemini|google)/i;
    if (b.includes('grok') || b.includes('xai')) return /(grok|xai)/i;
    if (b.includes('qwen') || b.includes('alibaba')) return /(qwen|alibaba)/i;
    if (b.includes('minimax')) return /minimax/i;
    if (b.includes('kimi')) return /kimi/i;
    if (b.includes('deepseek') || b === 'ds') return /deepseek/i;
    if (b.includes('glm')) return /glm/i;
    if (b.includes('mistral')) return /mistral/i;
    return new RegExp(brand, 'i');
}

/**
 * Sort models: enabled first, Grade A before Grade B, then lowest multiplier
 * @param {Array} models 
 * @returns {Array}
 */
function sortModels(models) {
    return [...models].sort((a, b) => {
        const enabledDiff = (b.enabled === true ? 1 : 0) - (a.enabled === true ? 1 : 0);
        if (enabledDiff !== 0) return enabledDiff;

        const gradeWeight = (grade) => {
            if (!grade) return 99;
            const g = String(grade).toUpperCase();
            if (g === 'A') return 1;
            if (g === 'B') return 2;
            if (g === 'C') return 3;
            return 10;
        };
        const gradeDiff = gradeWeight(a.grade) - gradeWeight(b.grade);
        if (gradeDiff !== 0) return gradeDiff;

        const multDiff = (a.multiplier || 1) - (b.multiplier || 1);
        if (multDiff !== 0) return multDiff;

        return 0;
    });
}

/**
 * Get vision models sorted by priority
 * @param {Object} options
 * @param {boolean} options.allowClaude
 * @param {string|null} options.brandFilter
 * @param {boolean} options.forceRefresh
 * @returns {Promise<string[]>}
 */
export async function getVisionModels({ allowClaude = false, brandFilter = null, forceRefresh = false } = {}) {
    const allModels = await fetchAiModels(forceRefresh);

    let visionList = allModels.filter(m => isVisionModel(m));

    if (!allowClaude) {
        visionList = visionList.filter(m => !/claude/i.test(m.id));
    }

    if (brandFilter) {
        const brandRegex = getBrandRegex(brandFilter);
        const matched = visionList.filter(m => brandRegex.test(m.id));
        if (matched.length > 0) {
            return sortModels(matched).map(m => m.id);
        }
        return [];
    }

    const sorted = sortModels(visionList);
    const result = sorted.map(m => m.id);

    if (result.length === 0) {
        return allowClaude ? ['kimi-k3', 'claude-sonnet-5-b', 'claude-opus-5-b'] : ['kimi-k3'];
    }

    return result;
}

/**
 * Get text models sorted by priority
 * @param {Object} options
 * @param {boolean} options.allowClaude
 * @param {string|null} options.brandFilter
 * @param {boolean} options.forceRefresh
 * @returns {Promise<string[]>}
 */
export async function getTextModels({ allowClaude = false, brandFilter = null, forceRefresh = false } = {}) {
    const allModels = await fetchAiModels(forceRefresh);

    let textList = allModels.filter(m => !m.vision || m.modalities?.input?.includes('text') || !m.modalities?.input || m.modalities?.input?.length === 0);

    if (!allowClaude) {
        textList = textList.filter(m => !/claude/i.test(m.id));
    }

    if (brandFilter) {
        const brandRegex = getBrandRegex(brandFilter);
        const matched = textList.filter(m => brandRegex.test(m.id));
        if (matched.length > 0) {
            return sortModels(matched).map(m => m.id);
        }
        return [];
    }

    const realModels = textList.filter(m => m.id !== 'auto');
    const sorted = sortModels(realModels);
    const result = sorted.map(m => m.id);

    if (result.length === 0) {
        return [
            'kimi-k2.7-code', 'deepseek-v4-pro', 'kimi-k3', 'deepseek-v4-mod',
            'glm-5.2', 'kimi-k2.7-code-highspeed', 'deepseek-v4-pro-0813', 'deepseek-v4-flash',
            'glm-5.3', 'mimo-v2.5-pro', 'minimax-m3', 'hy3'
        ];
    }

    return result;
}

/**
 * Determine quote option based on chat type and media presence
 * @param {Object} msgData 
 * @param {Object} m 
 * @returns {Object}
 */
export function getQuoteOption(msgData, m) {
    if (!msgData.isGroup) {
        const hasMedia = msgData.isMedia || msgData.isQuotedMedia;
        return hasMedia ? { quoted: m } : {};
    }
    return { quoted: m };
}

/**
 * Centralized executor for AI model requests
 * Handles dynamic model inspection, vision/text routing, fallbacks, and persona response.
 * 
 * @param {Object} options
 * @param {Object} options.sock
 * @param {Object} options.m
 * @param {Object} options.msgData
 * @param {string|null} options.brandFilter
 * @param {boolean} options.allowClaude
 * @param {string} options.pluginName
 * @param {string|null} options.customHelp
 */
export async function executeAiRequest({
    sock,
    m,
    msgData,
    brandFilter = null,
    allowClaude = false,
    pluginName = 'AI',
    customHelp = null
}) {
    if (sock?.sendPresenceUpdate && msgData?.remoteJid) {
        await sock.sendPresenceUpdate('composing', msgData.remoteJid).catch(() => { });
    }

    let text = (msgData.args || []).join(' ');

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
            try {
                const buffer = await msgData.downloadMedia();
                if (buffer) {
                    imageUrl = await compressImageToBase64(buffer);
                }
            } catch (uploadErr) {
                console.warn(`[${pluginName}] Image processing failed:`, uploadErr.message);
            }
        }

        if (!text && imageUrl) {
            text = 'Jelaskan gambar ini';
        }

        if (!text) {
            const commandTrigger = msgData.commandName || 'ai';
            const defaultPrompt = `Uwaaa! Sayangku mau tanya apa sama ${pluginName} Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan atau kirim/balas gambar dengan perintah *.\${commandTrigger} <teks>* yaa~! (๑>ᴗ<๑)`.replace('${commandTrigger}', commandTrigger);
            return sock.sendMessage(msgData.remoteJid, {
                text: customHelp || defaultPrompt
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
        let data = null;
        let lastError = null;

        // Step 1: Check dynamic models and determine Vision vs Text
        if (imageUrl) {
            let visionModels = await getVisionModels({ allowClaude, brandFilter });

            // If this brand doesn't have a vision model enabled, check all available vision models if not restricted
            if (visionModels.length === 0 && !brandFilter) {
                visionModels = await getVisionModels({ allowClaude: false });
            }

            for (const modelName of visionModels) {
                try {
                    const payload = {
                        text: text,
                        model: modelName,
                        prompt: prompt,
                        session: session,
                        image: imageUrl
                    };
                    const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/vision-model`, payload, { timeout: 20000 });
                    if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                        data = res.data;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[${pluginName}] Vision model '${modelName}' failed, attempting fallback...`);
                }
            }
        }

        // Step 2: Fallback to Text Model (or primary text if no image)
        if (!data || !data.result) {
            const textInput = imageUrl ? `[Lampiran Media: User melampirkan gambar/foto]\n\n[Pertanyaan/Pesan]: ${text}` : text;
            let textModels = await getTextModels({ allowClaude, brandFilter });

            // Fallback to general enabled text models if brand has no available models
            if (textModels.length === 0) {
                textModels = await getTextModels({ allowClaude });
            }

            for (const modelName of textModels) {
                try {
                    const payload = {
                        text: textInput,
                        model: modelName,
                        prompt: prompt,
                        session: session
                    };
                    const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/text-model`, payload, { timeout: 20000 });
                    if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                        data = res.data;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[${pluginName}] Text model '${modelName}' failed, attempting fallback...`);
                }
            }
        }

        // Step 3: If still failing, force refresh models cache from endpoint and retry once
        if (!data || !data.result) {
            console.warn(`[${pluginName}] All models failed, force-refreshing endpoint model list and retrying...`);
            const freshTextModels = await getTextModels({ allowClaude, forceRefresh: true });
            for (const modelName of freshTextModels.slice(0, 3)) {
                try {
                    const payload = {
                        text: imageUrl ? `[Lampiran Media: User melampirkan gambar/foto]\n\n[Pertanyaan/Pesan]: ${text}` : text,
                        model: modelName,
                        prompt: prompt,
                        session: session
                    };
                    const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/text-model`, payload, { timeout: 20000 });
                    if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                        data = res.data;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                }
            }
        }

        if (!data || !data.result) {
            throw new Error(lastError?.message || data?.message || data?.error || 'Gagal mendapatkan respon dari AI.. (╥﹏╥)');
        }

        await sock.sendMessage(msgData.remoteJid, { text: cleanAiResponse(data.result) }, getQuoteOption(msgData, m));

    } catch (error) {
        console.error(`${pluginName} Plugin Error:`, error);
        await sock.sendMessage(msgData.remoteJid, {
            text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
        }, { quoted: m });
    }
}
