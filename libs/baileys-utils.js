import config from '../config.js';

/**
 * Robust Profile Picture Fetcher (Bypass Baileys tcToken Bug)
 * @param {import('@whiskeysockets/baileys').WASocket} sock 
 * @param {string} jid Target JID or LID
 * @param {'image'|'preview'} type 
 * @returns {Promise<string>}
 */
export const getPP = async (sock, jid, type = 'image') => {
    try {
        // Bersihkan JID/LID dari device index
        const cleanJid = jid.split('@')[0].split(':')[0] + (jid.includes('@lid') ? '@lid' : '@s.whatsapp.net');

        // Gunakan Raw Query untuk bypass bug tcToken di Baileys terbaru
        const result = await sock.query({
            tag: 'iq',
            attrs: {
                to: 's.whatsapp.net',
                type: 'get',
                xmlns: 'w:profile:picture',
                target: cleanJid,
            },
            content: [
                {
                    tag: 'picture',
                    attrs: { type, query: 'url' }
                }
            ]
        });

        const picture = result.content?.find(c => c.tag === 'picture');
        if (picture && picture.attrs.url) {
            return picture.attrs.url;
        }

        // Fallback ke fungsi bawaan jika raw query gagal (siapa tahu sudah difix di internal)
        return await sock.profilePictureUrl(cleanJid, type).catch(_ => config.RYZUMI_DEFAULT_PP);
    } catch (error) {
        console.error('getPP Error:', error.message);
        return config.RYZUMI_DEFAULT_PP;
    }
};
