import { resolveLidToJid } from '../lid-resolver.js';
import { unwrapMessage, getMessageType, getMessageContent } from './messageUnwrapper.js';
import { getPP } from '../baileys-utils.js';
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

    const quotedMsg = isQuoted ? unwrapMessage(contextInfo.quotedMessage) : null;
    const quotedType = isQuoted ? getMessageType(quotedMsg) : '';
    const quotedContent = isQuoted ? getMessageContent(quotedMsg, quotedType) : '';

    const isMedia = /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(messageType);
    const mime = msg[messageType]?.mimetype || '';

    const isQuotedMedia = isQuoted && /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(quotedType);
    const quotedMime = isQuoted ? (quotedMsg[quotedType]?.mimetype || '') : '';

    const remoteJid = resolveLidToJid(rawRemoteJid, sock);

    return {
        // Core Properties
        isGroup,
        remoteJid,
        senderJid,
        fromMe,
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
            const q = isQuoted ? quotedMsg : msg;
            const type = isQuoted ? quotedType : messageType;
            if (!/image|video|audio|sticker|document/i.test(type)) return null;

            const mediaType = type.replace('Message', '');
            const stream = await import('baileys').then(mod => mod.downloadContentFromMessage(
                q[type] || q,
                mediaType === 'sticker' ? 'image' : mediaType
            ));

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
        getPP: async (jid, type = 'image') => getPP(sock, jid, type)
    };
};

