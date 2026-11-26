const MAX_CACHE_SIZE = 2000;
const messageCache = new Map();

/**
 * Menyimpan pesan masuk ke dalam cache memori terbatas (untuk fallback quoted media seperti view-once).
 * @param {object} m Objek pesan mentah dari Baileys
 */
export const cacheMessage = (m) => {
    const id = m?.key?.id;
    if (!id || !m?.message) return;

    if (messageCache.has(id)) {
        messageCache.delete(id);
    } else if (messageCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = messageCache.keys().next().value;
        messageCache.delete(oldestKey);
    }

    messageCache.set(id, {
        key: m.key,
        message: m.message,
        timestamp: Date.now()
    });
};

/**
 * Mengambil pesan yang tersimpan di cache berdasarkan message/stanza ID.
 * @param {string} id
 * @returns {{ key: object, message: object, timestamp: number } | null}
 */
export const getCachedMessage = (id) => {
    if (!id) return null;
    return messageCache.get(id) || null;
};

/**
 * Menghapus semua cache pesan.
 */
export const clearMessageCache = () => {
    messageCache.clear();
};

export default messageCache;
