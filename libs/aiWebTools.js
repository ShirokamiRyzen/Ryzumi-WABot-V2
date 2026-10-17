import axios from 'axios';
import config from '../config.js';

const SEARCH_TIMEOUT = 20000;
const FETCH_TIMEOUT = 30000;
const MAX_CONTENT_LENGTH = 12000; // Limit parsed text so context window is not overloaded

/**
 * Resolve the Neko-Router base URL and API key used for the search/fetch tools.
 * OPENAI_BASE_URL already points to the router's /v1 endpoint, so the tools
 * live at `${OPENAI_BASE_URL}/tools/search` and `${OPENAI_BASE_URL}/tools/fetch`.
 * @returns {{ baseURL: string, apiKey: string }}
 */
function getRouterConfig() {
 const baseURL = (config.OPENAI_BASE_URL || 'https://router.ryzumi.net/v1').replace(/\/+$/, '');
 const apiKey = config.OPENAI_API_KEY;

 if (!apiKey) {
 throw new Error('OPENAI_API_KEY belum diset. Tool search/fetch membutuhkan API key Neko-Router.');
 }

 return { baseURL, apiKey };
}

function getRouterErrorMessage(error, fallback) {
 return error?.response?.data?.error?.message || error?.message || fallback;
}

/**
 * Perform web search through the Neko-Router /v1/tools/search endpoint.
 * The router handles DuckDuckGo scraping, retries, and rate limiting.
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

 const { baseURL, apiKey } = getRouterConfig();
 const limit = Math.min(Math.max(Math.floor(Number(maxResults) || 5), 1), 20);

 try {
 const { data } = await axios.post(
 `${baseURL}/tools/search`,
 { query: trimmedQuery, maxResults: limit },
 {
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${apiKey}`
 },
 timeout: SEARCH_TIMEOUT
 }
 );

 return Array.isArray(data?.results) ? data.results : [];
 } catch (error) {
 const message = getRouterErrorMessage(error, 'Gagal mencari di DuckDuckGo via Router.');
 console.error('searchDuckDuckGo (Router) Error:', message);
 throw new Error(`Gagal mencari via Router: ${message}`);
 }
}

/**
 * Fetch and extract readable content from a URL through the Neko-Router
 * /v1/tools/fetch endpoint. Supports HTML, JSON, XML, and plain text.
 * @param {string} url
 * @param {number} maxChars
 * @returns {Promise<{url: string, contentType: string, title?: string, content: string, truncated?: boolean}>}
 */
export async function fetchWebPage(url, maxChars = MAX_CONTENT_LENGTH) {
 if (!url || typeof url !== 'string') {
 throw new Error('URL tujuan tidak valid');
 }

 let targetUrl = url.trim();
 if (!/^https?:\/\//i.test(targetUrl)) {
 targetUrl = `https://${targetUrl}`;
 }

 const { baseURL, apiKey } = getRouterConfig();
 const limit = Math.min(Math.max(Math.floor(Number(maxChars) || MAX_CONTENT_LENGTH), 500), 100000);

 try {
 const { data } = await axios.post(
 `${baseURL}/tools/fetch`,
 { url: targetUrl, maxChars: limit },
 {
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${apiKey}`
 },
 timeout: FETCH_TIMEOUT
 }
 );

 return {
 url: data?.url || targetUrl,
 contentType: data?.contentType || 'text/plain',
 title: data?.title,
 content: data?.content || '',
 truncated: Boolean(data?.truncated)
 };
 } catch (error) {
 const message = getRouterErrorMessage(error, `Gagal membuka atau membaca halaman ${targetUrl}.`);
 console.error(`fetchWebPage (Router) Error [${targetUrl}]:`, message);
 throw new Error(`Gagal membuka halaman via Router: ${message}`);
 }
}
