import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.resolve(process.cwd(), 'sessions_ai');

// Ensure directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Sanitize session key to prevent directory traversal
 * @param {string} sessionKey 
 * @returns {string}
 */
function getSessionFilePath(sessionKey) {
    const sanitized = String(sessionKey || 'default').replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(SESSIONS_DIR, `${sanitized}.json`);
}

/**
 * Load chat history for a session
 * @param {string} sessionKey 
 * @returns {Array<{role: string, content: any, tool_calls?: any, tool_call_id?: string}>}
 */
export function getSessionHistory(sessionKey) {
    try {
        const filePath = getSessionFilePath(sessionKey);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                return data;
            }
        }
    } catch (err) {
        console.warn(`[AiSessionManager] Failed to read session ${sessionKey}:`, err.message);
    }
    return [];
}

/**
 * Save chat history for a session (with message limit pruning)
 * @param {string} sessionKey 
 * @param {Array} history 
 * @param {number} maxMessages 
 */
export function saveSessionHistory(sessionKey, history, maxMessages = 20) {
    try {
        const filePath = getSessionFilePath(sessionKey);
        let trimmed = history;
        if (history.length > maxMessages) {
            // Keep recent turns, avoiding breaking tool call / tool response pairs if possible
            trimmed = history.slice(-maxMessages);
            // If the first message in trimmed is a tool response without tool call, slice further
            while (trimmed.length > 0 && trimmed[0].role === 'tool') {
                trimmed = trimmed.slice(1);
            }
        }
        fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err) {
        console.error(`[AiSessionManager] Failed to save session ${sessionKey}:`, err.message);
    }
}

/**
 * Clear/delete session file
 * @param {string} sessionKey 
 * @returns {boolean}
 */
export function clearSession(sessionKey) {
    try {
        const filePath = getSessionFilePath(sessionKey);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch (err) {
        console.warn(`[AiSessionManager] Failed to clear session ${sessionKey}:`, err.message);
    }
    return false;
}
