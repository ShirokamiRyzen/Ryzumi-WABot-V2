import axios from 'axios';
import sharp from 'sharp';
import config from '../config.js';
import { ryzumiCDN } from './uploader.js';
import { RYZUMI_AI_SYSTEM_PROMPT, cleanAiResponse } from './aiPrompt.js';
import { searchDuckDuckGo, fetchWebPage } from './aiWebTools.js';
import { getSessionHistory, saveSessionHistory } from './aiSessionManager.js';

let cachedOpenAiModels = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30s cache

/**
 * Compress an image buffer with sharp and upload it to Ryzumi CDN,
 * returning a publicly accessible HTTP URL for AI vision endpoints.
 * @param {Buffer} buffer 
 * @param {Object} options
 * @returns {Promise<string|null>}
 */
export async function uploadCompressedImage(buffer, { maxDimension = 1024, quality = 80 } = {}) {
    if (!buffer || !Buffer.isBuffer(buffer)) return null;
    let uploadBuf = buffer;
    try {
        uploadBuf = await sharp(buffer)
            .rotate()
            .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality, progressive: true })
            .toBuffer();
    } catch (err) {
        console.warn('Image compression with sharp failed, uploading original buffer:', err.message);
    }

    try {
        const cdnRes = await ryzumiCDN(uploadBuf);
        const url = cdnRes?.url || cdnRes?.result?.url || (typeof cdnRes?.result === 'string' ? cdnRes.result : (Array.isArray(cdnRes?.result) ? cdnRes.result[0]?.url : null));
        return url;
    } catch (cdnErr) {
        console.warn('Upload to Ryzumi CDN failed:', cdnErr.message);
        return null;
    }
}

/**
 * Fetch available OpenAI-compatible models from OPENAI_BASE_URL
 * @param {boolean} forceRefresh 
 * @returns {Promise<string[]>}
 */
export async function fetchOpenAiModels(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedOpenAiModels && (now - lastFetchTime < CACHE_TTL)) {
        return cachedOpenAiModels;
    }

    try {
        const baseURL = config.OPENAI_BASE_URL || 'https://router.ryzumi.net/v1';
        const apiKey = config.OPENAI_API_KEY;

        const res = await axios.get(`${baseURL}/models`, {
            headers: {
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
            },
            timeout: 10000
        });

        let list = [];
        if (res.data?.data && Array.isArray(res.data.data)) {
            list = res.data.data.map(m => m.id);
        } else if (Array.isArray(res.data)) {
            list = res.data.map(m => m.id || m);
        }

        if (list.length > 0) {
            cachedOpenAiModels = list;
            lastFetchTime = now;
            return cachedOpenAiModels;
        }
    } catch (err) {
        console.warn('Failed to fetch OpenAI models from router:', err.message);
    }

    return cachedOpenAiModels || [
        'bandelbanget/auto',
        'bandelbanget/deepseek-v4-pro',
        'bandelbanget/deepseek-v4-flash',
        'bandelbanget/glm-5.2',
        'bandelbanget/kimi-k3'
    ];
}

/**
 * Check if a model is vision-capable based on name conventions
 * @param {string} modelId 
 * @returns {boolean}
 */
export function isVisionModel(modelId) {
    if (!modelId) return false;
    const lower = modelId.toLowerCase();
    return lower.includes('vision') || lower.includes('vl') || lower.includes('4v') || lower.includes('omni') || lower.includes('gemini') || lower.includes('claude') || lower.includes('gpt-5') || lower.includes('auto');
}

/**
 * Helper to match brand preference in OpenAI models
 * @param {string} brand 
 * @returns {RegExp|null}
 */
export function getBrandRegex(brand) {
    if (!brand) return null;
    const b = brand.toLowerCase().trim();
    if (b.includes('tencent') || b.includes('hy3') || b.includes('hunyuan')) return /(tencent|hy3|hy4|hunyuan)/i;
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
 * Get vision-capable models filtered and prioritized
 * @param {Object} options
 * @returns {Promise<string[]>}
 */
export async function getVisionModels({ allowClaude = false, brandFilter = null, forceRefresh = false } = {}) {
    const all = await fetchOpenAiModels(forceRefresh);
    let filtered = all.filter(m => isVisionModel(m));

    if (!allowClaude) {
        filtered = filtered.filter(m => !/claude/i.test(m));
    }

    if (brandFilter) {
        const regex = getBrandRegex(brandFilter);
        const matched = filtered.filter(m => regex.test(m));
        if (matched.length > 0) return matched;
    }

    // Default fallback order
    const priority = ['bandelbanget/deepseek-v4-flash-vision-exp', 'bandelbanget/auto'];
    const rest = filtered.filter(m => !priority.includes(m));
    return [...priority.filter(p => all.includes(p)), ...rest];
}

/**
 * Get text models filtered and prioritized
 * @param {Object} options
 * @returns {Promise<string[]>}
 */
export async function getTextModels({ allowClaude = false, brandFilter = null, forceRefresh = false } = {}) {
    const all = await fetchOpenAiModels(forceRefresh);
    let filtered = all;

    if (!allowClaude) {
        filtered = filtered.filter(m => !/claude/i.test(m));
    }

    if (brandFilter) {
        const regex = getBrandRegex(brandFilter);
        const matched = filtered.filter(m => regex.test(m));
        if (matched.length > 0) return matched;
    }

    // Prioritize high-performance active models
    const preferredOrder = [
        'bandelbanget/auto',
        'bandelbanget/deepseek-v4-pro',
        'bandelbanget/deepseek-v4-flash',
        'bandelbanget/glm-5.2',
        'bandelbanget/kimi-k3',
        'bandelbanget/mimo-v2.5-pro',
        'bandelbanget/minimax-m3'
    ];

    const sorted = [
        ...preferredOrder.filter(p => filtered.includes(p)),
        ...filtered.filter(m => !preferredOrder.includes(m))
    ];

    return sorted.length > 0 ? sorted : ['bandelbanget/auto'];
}

/**
 * Web Search & Web Browsing Tools definition for OpenAI-compatible function calling
 */
export const AI_WEB_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'search_web',
            description: 'Mencari informasi terkini, berita, artikel, atau referensi di internet menggunakan mesin pencari DuckDuckGo Lite. Gunakan tool ini saat butuh info terbaru atau hal spesifik yang tidak kamu ketahui.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Kata kunci pencarian spesifik (contoh: "jadwal rilis anime 2026", "harga emas hari ini")'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'browse_web',
            description: 'Membuka, menjelajahi, dan membaca isi halaman website, URL artikel, atau endpoint API (JSON, HTML, teks). Gunakan tool ini setelah mendapatkan URL dari pencarian atau jika user memberikan link web.',
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'Alamat URL website yang ingin dibuka dan dibaca isinya (contoh: "https://id.wikipedia.org/...")'
                    }
                },
                required: ['url']
            }
        }
    }
];

/**
 * Execute tool call dynamically
 * @param {string} name 
 * @param {Object} args 
 * @returns {Promise<string>}
 */
export async function executeAiTool(name, args) {
    if (name === 'search_web') {
        const query = args.query || args.q;
        console.log(`[AI Tool: search_web] Query: "${query}"`);
        const searchResults = await searchDuckDuckGo(query, 5);
        if (!searchResults || searchResults.length === 0) {
            return JSON.stringify({ status: 'not_found', message: 'Tidak ada hasil pencarian yang ditemukan di DuckDuckGo.' });
        }
        return JSON.stringify({ status: 'success', results: searchResults }, null, 2);
    }

    if (name === 'browse_web') {
        const url = args.url || args.link;
        console.log(`[AI Tool: browse_web] URL: "${url}"`);
        const page = await fetchWebPage(url);
        return JSON.stringify({
            status: 'success',
            url: page.url,
            contentType: page.contentType,
            title: page.title || 'Untitled',
            content: page.content
        }, null, 2);
    }

    throw new Error(`Unknown tool: ${name}`);
}

/**
 * Request OpenAI Chat Completion with Server-Sent Events (SSE) Stream.
 * Accurately handles long-running requests and parses streaming tool calls.
 * 
 * @param {Object} options
 * @param {string} options.model
 * @param {Array} options.messages
 * @param {Array|null} options.tools
 * @param {number} options.timeout
 * @returns {Promise<{content: string, toolCalls: Array}>}
 */
export async function requestOpenAiSse({ model, messages, tools = null, timeout = 90000 }) {
    const baseURL = config.OPENAI_BASE_URL || 'https://router.ryzumi.net/v1';
    const apiKey = config.OPENAI_API_KEY;

    const payload = {
        model,
        messages,
        stream: true
    };

    if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
    }

    const response = await axios.post(`${baseURL}/chat/completions`, payload, {
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        responseType: 'stream',
        timeout
    });

    return new Promise((resolve, reject) => {
        let content = '';
        const toolCallsMap = new Map();
        let buffer = '';

        response.data.on('data', (chunk) => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep unfinished line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(':')) continue; // SSE comment or ping

                if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.slice(6).trim();
                    if (dataStr === '[DONE]') continue;

                    try {
                        const json = JSON.parse(dataStr);
                        const delta = json.choices?.[0]?.delta;
                        if (!delta) continue;

                        if (delta.content) {
                            content += delta.content;
                        }

                        if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                            for (const tc of delta.tool_calls) {
                                const idx = tc.index ?? 0;
                                if (!toolCallsMap.has(idx)) {
                                    toolCallsMap.set(idx, {
                                        id: tc.id || `call_${Date.now()}_${idx}`,
                                        type: 'function',
                                        function: {
                                            name: tc.function?.name || '',
                                            arguments: tc.function?.arguments || ''
                                        }
                                    });
                                } else {
                                    const existing = toolCallsMap.get(idx);
                                    if (tc.id) existing.id += tc.id;
                                    if (tc.function?.name) existing.function.name += tc.function.name;
                                    if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
                                }
                            }
                        }
                    } catch (parseErr) {
                        // ignore malformed SSE chunk
                    }
                }
            }
        });

        response.data.on('end', () => {
            const toolCalls = Array.from(toolCallsMap.values()).filter(t => t.function.name);
            resolve({ content, toolCalls });
        });

        response.data.on('error', (err) => {
            reject(err);
        });
    });
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
 * Centralized executor for AI model requests using OpenAI-compatible SSE and local sessions
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
                    imageUrl = await uploadCompressedImage(buffer);
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

        // Determine session identifier (saved locally in sessions_ai folder)
        let sessionKey;
        if (msgData.isGroup) {
            const groupNumber = (msgData.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
            sessionKey = `group_${groupNumber}`;
        } else {
            const rawNumber = (msgData.senderJid || m?.sender || '').split('@')[0].replace(/[^0-9]/g, '');
            sessionKey = `user_${rawNumber || 'user'}`;
        }

        // Load local session history
        const history = getSessionHistory(sessionKey);

        // Build current user message payload
        let userMessageContent;
        if (imageUrl) {
            userMessageContent = [
                { type: 'text', text: text },
                { type: 'image_url', image_url: { url: imageUrl } }
            ];
        } else {
            userMessageContent = text;
        }

        const messages = [
            { role: 'system', content: RYZUMI_AI_SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: userMessageContent }
        ];

        // Select models
        let candidateModels = imageUrl
            ? await getVisionModels({ allowClaude, brandFilter })
            : await getTextModels({ allowClaude, brandFilter });

        if (candidateModels.length === 0) {
            candidateModels = ['bandelbanget/auto', 'bandelbanget/deepseek-v4-pro'];
        }

        let finalAnswer = '';
        let lastError = null;

        // Loop candidate models
        for (const model of candidateModels) {
            try {
                let currentMessages = [...messages];
                let maxToolSteps = 5;

                while (maxToolSteps > 0) {
                    maxToolSteps--;

                    const { content, toolCalls } = await requestOpenAiSse({
                        model,
                        messages: currentMessages,
                        tools: AI_WEB_TOOLS,
                        timeout: 60000
                    });

                    // If tool calls were triggered
                    if (toolCalls && toolCalls.length > 0) {
                        currentMessages.push({
                            role: 'assistant',
                            content: content || null,
                            tool_calls: toolCalls
                        });

                        for (const toolCall of toolCalls) {
                            let toolArgs = {};
                            try {
                                toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                            } catch (e) { }

                            let toolResult = '';
                            try {
                                toolResult = await executeAiTool(toolCall.function.name, toolArgs);
                            } catch (toolErr) {
                                toolResult = JSON.stringify({ error: toolErr.message });
                            }

                            currentMessages.push({
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                content: toolResult
                            });
                        }
                        // Continue loop for AI to produce final answer with tool outputs
                        continue;
                    }

                    if (content) {
                        finalAnswer = content;
                        // Update session history with final turns
                        history.push({ role: 'user', content: text });
                        history.push({ role: 'assistant', content: finalAnswer });
                        saveSessionHistory(sessionKey, history);
                        break;
                    }
                }

                if (finalAnswer) break;
            } catch (err) {
                console.warn(`[${pluginName}] Model '${model}' failed with SSE:`, err.message);
                lastError = err;
            }
        }

        if (!finalAnswer) {
            throw new Error(lastError?.message || 'Gagal mendapatkan respon dari AI.. (╥﹏╥)');
        }

        const cleanedResponse = cleanAiResponse(finalAnswer);
        await sock.sendMessage(msgData.remoteJid, { text: cleanedResponse }, getQuoteOption(msgData, m));

    } catch (error) {
        console.error(`${pluginName} Plugin Error:`, error);
        await sock.sendMessage(msgData.remoteJid, {
            text: `Uwaaa gawat! Ryzumi lagi pusing atau ada masalah saat memproses pesan kakak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
        }, { quoted: m });
    }
}
