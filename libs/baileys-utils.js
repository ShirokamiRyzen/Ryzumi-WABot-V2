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

/**
 * Send WhatsApp Album Message (Multiple images/videos grouped into an album)
 * @param {import('@whiskeysockets/baileys').WASocket} sock 
 * @param {string} jid Target JID
 * @param {Array<{ image?: Buffer|string|{ url: string }, video?: Buffer|string|{ url: string }, caption?: string }>} medias 
 * @param {object} [options] Options passed to initial parent message (e.g. { quoted: m })
 * @returns {Promise<{ albumMsg: any, sentMessages: Array<any> }>}
 */
export const sendAlbumMessage = async (sock, jid, medias, options = {}) => {
    if (!Array.isArray(medias) || medias.length === 0) {
        throw new Error('Medias array must not be empty.');
    }

    let expectedImageCount = 0;
    let expectedVideoCount = 0;

    for (const item of medias) {
        if (item.video) {
            expectedVideoCount++;
        } else {
            expectedImageCount++;
        }
    }

    // 1. Send album parent message
    const albumMsg = await sock.sendMessage(jid, {
        album: {
            expectedImageCount,
            expectedVideoCount
        }
    }, options);

    // 2. Send each media associated with albumParentKey
    const sentMessages = [];
    for (const item of medias) {
        let mediaPayload = {};
        if (item.video) {
            mediaPayload = {
                video: typeof item.video === 'string' ? { url: item.video } : item.video,
                caption: item.caption || ''
            };
        } else {
            mediaPayload = {
                image: typeof item.image === 'string' ? { url: item.image } : item.image,
                caption: item.caption || ''
            };
        }

        const sent = await sock.sendMessage(jid, {
            ...mediaPayload,
            albumParentKey: albumMsg.key
        });
        sentMessages.push(sent);
    }

    return { albumMsg, sentMessages };
};

