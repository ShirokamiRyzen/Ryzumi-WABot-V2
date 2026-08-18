import axios from 'axios';
import config from '../config.js';

let cachedModels = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache to avoid spamming the endpoint on every message

/**
 * Fetch models dynamically from Ryzumi API
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
        if (res?.data?.data && Array.isArray(res.data.data)) {
            cachedModels = res.data.data;
            lastFetchTime = now;
            return cachedModels;
        }
    } catch (err) {
        console.warn('Failed to fetch AI models dynamically:', err.message);
    }

    return cachedModels || [];
}

/**
 * Get vision models sorted by priority
 * @param {Object} options
 * @param {boolean} options.allowClaude
 * @param {boolean} options.prioritizeLuna
 * @returns {Promise<string[]>}
 */
export async function getVisionModels({ allowClaude = false, prioritizeLuna = true } = {}) {
    const allModels = await fetchAiModels();

    let visionList = allModels.filter(m => m.vision === true || (m.modalities?.input?.includes('image')));

    if (!allowClaude) {
        visionList = visionList.filter(m => !/claude/i.test(m.id));
    }

    const enabled = visionList.filter(m => m.enabled === true);
    const disabled = visionList.filter(m => m.enabled !== true);

    const sortFn = (a, b) => {
        if (prioritizeLuna) {
            const isLunaA = /luna/i.test(a.id);
            const isLunaB = /luna/i.test(b.id);
            if (isLunaA && !isLunaB) return -1;
            if (!isLunaA && isLunaB) return 1;
        }
        return (a.multiplier || 1) - (b.multiplier || 1);
    };

    enabled.sort(sortFn);
    disabled.sort(sortFn);

    const result = [...enabled.map(m => m.id), ...disabled.map(m => m.id)];

    // Fallback static list if API returns empty
    if (result.length === 0) {
        return prioritizeLuna
            ? ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6', 'gpt-5.6-luna-b', 'gpt-5.6-terra-b', 'gpt-5.5', 'auto-debug']
            : ['gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.6', 'gpt-5.6-terra-b', 'gpt-5.6-luna-b', 'gpt-5.5', 'auto-debug'];
    }

    return result;
}

/**
 * Get text models sorted by priority
 * @param {Object} options
 * @param {boolean} options.allowClaude
 * @param {string} options.brandFilter e.g. 'deepseek', 'gpt', 'glm', 'kimi', 'qwen', 'claude'
 * @returns {Promise<string[]>}
 */
export async function getTextModels({ allowClaude = false, brandFilter = null } = {}) {
    const allModels = await fetchAiModels();

    let textList = allModels.filter(m => !m.vision || (m.modalities?.input?.includes('text')));

    if (!allowClaude) {
        textList = textList.filter(m => !/claude/i.test(m.id));
    }

    if (brandFilter) {
        const brandRegex = new RegExp(brandFilter, 'i');
        const matched = textList.filter(m => brandRegex.test(m.id));
        if (matched.length > 0) {
            const enabledMatched = matched.filter(m => m.enabled === true).sort((a, b) => (a.multiplier || 1) - (b.multiplier || 1));
            const disabledMatched = matched.filter(m => m.enabled !== true).sort((a, b) => (a.multiplier || 1) - (b.multiplier || 1));
            return [...enabledMatched.map(m => m.id), ...disabledMatched.map(m => m.id)];
        }
    }

    const enabled = textList.filter(m => m.enabled === true).sort((a, b) => {
        // Grade A first, then lowest multiplier
        const gradeA = (a.grade === 'A' ? 0 : 1) - (b.grade === 'A' ? 0 : 1);
        if (gradeA !== 0) return gradeA;
        return (a.multiplier || 1) - (b.multiplier || 1);
    });

    const disabled = textList.filter(m => m.enabled !== true).sort((a, b) => (a.multiplier || 1) - (b.multiplier || 1));

    const result = [...enabled.map(m => m.id), ...disabled.map(m => m.id)];

    if (result.length === 0) {
        return [
            'kimi-k2.7-code', 'gpt-5.6-terra', 'deepseek-v4-pro', 'kimi-k3', 'deepseek-v4-mod',
            'glm-5.2', 'kimi-k2.7-code-highspeed', 'deepseek-v4-pro-0813', 'deepseek-v4-flash',
            'glm-5.3', 'gpt-5.6-luna', 'gpt-5.6', 'auto'
        ];
    }

    return result;
}
