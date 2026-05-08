const groupCache = new Map();

/**
 * Menyimpan metadata grup ke dalam cache.
 * @param {string} jid 
 * @param {object} metadata 
 */
export const setGroupMetadata = (jid, metadata) => {
    groupCache.set(jid, metadata);
};

/**
 * Mengambil metadata grup dari cache.
 * @param {string} jid 
 * @returns {object|null}
 */
export const getGroupMetadata = (jid) => {
    return groupCache.get(jid) || null;
};

/**
 * Menghapus semua cache grup.
 */
export const clearGroupCache = () => {
    groupCache.clear();
};

export default groupCache;
