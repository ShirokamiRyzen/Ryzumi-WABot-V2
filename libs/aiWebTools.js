import axios from 'axios';
import * as cheerio from 'cheerio';

const DEFAULT_TIMEOUT = 20000;
const MAX_CONTENT_LENGTH = 12000; // Limit parsed text so context window is not overloaded

const LYNX_UA = 'Lynx/2.8.9rel.1 libwww-FM/2.14 SSL-MM/1.4.1 OpenSSL/1.0.2k-fips';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Perform web search using DuckDuckGo Lite (https://lite.duckduckgo.com/lite/) via Axios & Cheerio
 * @param {string} query 
 * @param {number} maxResults 
 * @returns {Promise<Array<{title: string, url: string, snippet: string}>>}
 */
export async function searchDuckDuckGo(query, maxResults = 5) {
    if (!query || typeof query !== 'string') {
        throw new Error('Query search harus berupa string');
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    try {
        const response = await axios.post('https://lite.duckduckgo.com/lite/', new URLSearchParams({ q: trimmedQuery }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': LYNX_UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: DEFAULT_TIMEOUT
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('a.result-link').each((i, el) => {
            if (results.length >= maxResults) return false;

            const title = $(el).text().trim();
            let url = $(el).attr('href');

            // Handle DDG lite redirect wrapper if present
            if (url && url.includes('uddg=')) {
                try {
                    const parsed = new URL(url, 'https://lite.duckduckgo.com');
                    const realUrl = parsed.searchParams.get('uddg');
                    if (realUrl) url = decodeURIComponent(realUrl);
                } catch (e) { }
            }

            // Find snippet usually situated in next tr
            const snippet = $(el).closest('tr').next().find('.result-snippet').text().trim();

            if (title && url) {
                results.push({ title, url, snippet });
            }
        });

        return results;
    } catch (error) {
        console.error('searchDuckDuckGo Error:', error.message);
        throw new Error(`Gagal mencari di DuckDuckGo: ${error.message}`);
    }
}

/**
 * Fetch and extract readable content from any URL / Web Page.
 * Supports HTML parsing with Cheerio, API / JSON responses, Plain Text, XML, Markdown, etc.
 * @param {string} url 
 * @param {number} maxChars 
 * @returns {Promise<{url: string, contentType: string, title?: string, content: string}>}
 */
export async function fetchWebPage(url, maxChars = MAX_CONTENT_LENGTH) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL tujuan tidak valid');
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/json,text/plain',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: DEFAULT_TIMEOUT,
            maxRedirects: 5,
            responseType: 'text',
            transformResponse: [data => data] // Keep raw to inspect format
        });

        const contentType = response.headers['content-type'] || '';
        const rawData = response.data;

        // 1. Check if response is JSON or API format
        if (/application\/json/i.test(contentType) || (typeof rawData === 'string' && (rawData.trim().startsWith('{') || rawData.trim().startsWith('[')))) {
            try {
                const parsedJson = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                const formatted = JSON.stringify(parsedJson, null, 2);
                return {
                    url: targetUrl,
                    contentType: 'application/json',
                    content: formatted.slice(0, maxChars) + (formatted.length > maxChars ? '\n... (konten dipotong)' : '')
                };
            } catch (err) {
                // If JSON parse failed, proceed as text
            }
        }

        // 2. Check if response is XML
        if (/application\/xml|text\/xml/i.test(contentType)) {
            const $ = cheerio.load(rawData, { xmlMode: true });
            const textContent = $.text().replace(/\s+/g, ' ').trim();
            return {
                url: targetUrl,
                contentType: 'application/xml',
                content: textContent.slice(0, maxChars)
            };
        }

        // 3. HTML parsing using Cheerio
        if (/text\/html/i.test(contentType) || (typeof rawData === 'string' && /<html/i.test(rawData))) {
            const $ = cheerio.load(rawData);

            // Clean unwanted tags that add noise
            $('script, style, noscript, svg, iframe, canvas, nav, footer, header, form, link, meta, style').remove();

            const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';

            // Extract main content priority: article, main, body
            let mainSelector = $('article, main, [role="main"]');
            if (!mainSelector.length) {
                mainSelector = $('body');
            }

            // Remove hidden elements
            mainSelector.find('[style*="display:none"], [style*="display: none"], .hidden, .hide').remove();

            // Extract meaningful text paragraphs and headers
            const lines = [];
            mainSelector.find('h1, h2, h3, h4, h5, p, li, blockquote, pre, code').each((_, el) => {
                const tag = el.tagName.toLowerCase();
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                if (text.length > 5) {
                    if (tag.startsWith('h')) {
                        lines.push(`\n### ${text}\n`);
                    } else if (tag === 'li') {
                        lines.push(`- ${text}`);
                    } else {
                        lines.push(text);
                    }
                }
            });

            let cleanText = lines.join('\n\n');
            if (!cleanText || cleanText.length < 50) {
                // Fallback to body text extraction
                cleanText = $('body').text().replace(/\n\s*\n+/g, '\n').replace(/[ \t]+/g, ' ').trim();
            }

            if (cleanText.length > maxChars) {
                cleanText = cleanText.slice(0, maxChars) + '\n... (konten web dipotong karena terlalu panjang)';
            }

            return {
                url: targetUrl,
                contentType: 'text/html',
                title,
                content: cleanText || '(Halaman tidak memiliki teks yang dapat dibaca)'
            };
        }

        // 4. Fallback: Plain text / Markdown / other formats
        const plainText = String(rawData).slice(0, maxChars);
        return {
            url: targetUrl,
            contentType: contentType || 'text/plain',
            content: plainText
        };

    } catch (error) {
        console.error(`fetchWebPage Error [${url}]:`, error.message);
        throw new Error(`Gagal membuka atau membaca halaman ${url}: ${error.message}`);
    }
}
