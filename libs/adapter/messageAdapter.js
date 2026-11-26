import { resolveLidToJid } from '../lid-resolver.js';
import { unwrapMessage, getMessageType, getMessageContent } from './messageUnwrapper.js';
import { getPP, sendAlbumMessage } from '../baileys-utils.js';
import { getCachedMessage } from '../messageCache.js';
import config from '../../config.js';
import User from '../../databases/orm/User.js';
import Group from '../../databases/orm/Group.js';

export const extractMessageData = (m, sock) => {
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const rawRemoteJid = m.key.remoteJid;
    const fromMe = m.key.fromMe;
    const rawBotId = sock?.user?.id || '';
    const botJid = resolveLidToJid(rawBotId.split(':')[0].split('@')[0] + (rawBotId.includes('@lid') ? '@lid' : '@s.whatsapp.net'), sock);

    let rawSenderJid;
    if (fromMe) {
        rawSenderJid = botJid;
    } else {
        rawSenderJid = isGroup ? (m.key.participant || rawRemoteJid) : rawRemoteJid;
        if (rawSenderJid && rawSenderJid.endsWith('@lid')) {
            if (isGroup && m.key.participantAlt && m.key.participantAlt.endsWith('@s.whatsapp.net')) {
                rawSenderJid = m.key.participantAlt;
            } else if (!isGroup && m.key.remoteJidAlt && m.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
                rawSenderJid = m.key.remoteJidAlt;
            }
        }
    }

    const senderJid = resolveLidToJid(rawSenderJid, sock);

    const msg = unwrapMessage(m.message);
    const messageType = getMessageType(msg);
    const messageContent = getMessageContent(msg, messageType).trim();

    const prefixes = ['.', '!', '/', '#'];
    let commandName = '';
    let args = [];

    const matchedPrefix = prefixes.find(p => messageContent.startsWith(p));
    if (matchedPrefix) {
        args = messageContent.slice(matchedPrefix.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    }

    const contextInfo = msg[messageType]?.contextInfo || {};
    const isQuoted = !!contextInfo.quotedMessage;

    let quotedMsg = isQuoted ? unwrapMessage(contextInfo.quotedMessage) : null;
    let quotedType = isQuoted ? getMessageType(quotedMsg) : '';

    // Fallback ke messageCache jika quotedMessage kehilangan url/directPath (misal reply pesan view-once)
    if (isQuoted && contextInfo.stanzaId) {
        const quotedMediaObj = quotedMsg?.[quotedType];
        const isStrippedMedia = !quotedMediaObj || (!quotedMediaObj.url && !quotedMediaObj.directPath);
        if (isStrippedMedia) {
            const cached = getCachedMessage(contextInfo.stanzaId);
            if (cached?.message) {
                const unwrappedCached = unwrapMessage(cached.message);
                const cachedType = getMessageType(unwrappedCached);
                if (cachedType && unwrappedCached[cachedType]) {
                    quotedMsg = unwrappedCached;
                    quotedType = cachedType;
                }
            }
        }
    }

    const quotedContent = isQuoted ? getMessageContent(quotedMsg, quotedType) : '';

    const isMedia = /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(messageType);
    const mime = msg[messageType]?.mimetype || '';

    const isQuotedMedia = isQuoted && /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(quotedType);
    const quotedMime = isQuoted ? (quotedMsg[quotedType]?.mimetype || '') : '';

    const remoteJid = resolveLidToJid(rawRemoteJid, sock);
    const fileName = msg.documentMessage?.fileName || quotedMsg?.documentMessage?.fileName || '';

    return {
        // Core Properties
        isGroup,
        remoteJid,
        senderJid,
        fromMe,
        fileName,
        pushName: m.pushName || 'User',
        messageType,
        messageContent,
        commandName,
        args,
        isQuoted,
        quotedMsg,
        quotedType,
        quotedContent,
        isMedia,
        mime,
        quotedMime,
        isQuotedMedia,
        mentions: contextInfo.mentionedJid || [],
        msg,
        contextInfo,

        // Modular Access
        config,
        db: { User, Group },

        // Helper Methods
        parseTargetJid: () => {
            let targetJid = null;
            if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
            } else if (isQuoted) {
                targetJid = contextInfo.participant || contextInfo.remoteJid;
                if (quotedType === 'contactMessage') {
                    const vcard = quotedMsg.contactMessage.vcard;
                    if (vcard && vcard.includes('waid=')) {
                        targetJid = vcard.split('waid=')[1].split(/[\n:]/)[0] + '@s.whatsapp.net';
                    }
                }
            } else if (args[0]) {
                let num = args[0].replace(/[^0-9]/g, '');
                if (num.length >= 10) {
                    targetJid = num + '@s.whatsapp.net';
                }
            }
            if (!targetJid) return null;

            const resolved = resolveLidToJid(targetJid, sock);
            if (resolved.endsWith('@g.us')) return resolved;
            return resolved.split(':')[0].split('@')[0] + '@s.whatsapp.net';
        },

        downloadMedia: async () => {
            let targetMsg = null;
            let targetType = '';

            if (/image|video|audio|sticker|document/i.test(messageType)) {
                targetMsg = msg;
                targetType = messageType;
            } else if (isQuoted && /image|video|audio|sticker|document/i.test(quotedType)) {
                targetMsg = quotedMsg;
                targetType = quotedType;
            }

            if (!targetMsg || !targetType) return null;

            const mediaType = targetType.replace('Message', '');
            const baileysType = mediaType === 'sticker' ? 'image' : mediaType;
            const mediaObj = targetMsg[targetType] || targetMsg;
            const { downloadContentFromMessage, DEF_MEDIA_HOST } = await import('baileys');

            // Hindari bug host placeholder seperti a.whatsapp.net pada Baileys 7.x saat directPath tersedia
            let opts = {};
            if (mediaObj?.directPath && mediaObj?.url) {
                try {
                    const host = new URL(mediaObj.url).host;
                    if (host === 'a.whatsapp.net') {
                        opts = { host: DEF_MEDIA_HOST || 'mmg.whatsapp.net' };
                    }
                } catch {
                    opts = { host: DEF_MEDIA_HOST || 'mmg.whatsapp.net' };
                }
            }

            let stream;
            try {
                stream = await downloadContentFromMessage(mediaObj, baileysType, opts);
            } catch (err) {
                if (mediaObj?.directPath && !opts.host && /ENOTFOUND|EAI_AGAIN/i.test(err?.message || '')) {
                    stream = await downloadContentFromMessage(mediaObj, baileysType, {
                        host: DEF_MEDIA_HOST || 'mmg.whatsapp.net'
                    });
                } else {
                    throw err;
                }
            }

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        },

        reply: async (text) => sock.sendMessage(remoteJid, { text }, { quoted: m }),
        //reply: async (text) => {
        //    await sock.sendPresenceUpdate('composing', remoteJid);
        //    const delay = Math.floor(Math.random() * 1500) + 1000;
        //    await new Promise(resolve => setTimeout(resolve, delay));
        //    await sock.sendPresenceUpdate('paused', remoteJid);
        //
        //    return sock.sendMessage(remoteJid, { text }, { quoted: m });
        //},
        react: async (emoji) => sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } }),
        getPP: async (jid, type = 'image') => getPP(sock, jid, type),
        sendAlbum: async (medias, options = {}) => sendAlbumMessage(sock, remoteJid, medias, { quoted: m, ...options })
    };
};

