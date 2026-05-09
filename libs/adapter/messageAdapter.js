import { resolveLidToJid } from '../lid-resolver.js';
import { unwrapMessage, getMessageType, getMessageContent } from './messageUnwrapper.js';

export const extractMessageData = (m, sock) => {
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const rawRemoteJid = m.key.remoteJid;
    const fromMe = m.key.fromMe;
    const rawBotId = sock?.user?.id || '';
    const botJid = resolveLidToJid(rawBotId.split(':')[0].split('@')[0] + (rawBotId.includes('@lid') ? '@lid' : '@s.whatsapp.net'));

    let rawSenderJid;
    if (fromMe) {
        rawSenderJid = botJid;
    } else {
        rawSenderJid = isGroup ? (m.key.participant || rawRemoteJid) : rawRemoteJid;
    }

    const senderJid = resolveLidToJid(rawSenderJid);

    const msg = unwrapMessage(m.message);
    const messageType = getMessageType(msg);
    const messageContent = getMessageContent(msg, messageType);

    let commandName = '';
    let args = [];
    if (messageContent.startsWith('.')) {
        args = messageContent.slice(1).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    }

    const contextInfo = msg[messageType]?.contextInfo || {};
    const isQuoted = !!contextInfo.quotedMessage;

    const quotedMsg = isQuoted ? unwrapMessage(contextInfo.quotedMessage) : null;
    const quotedType = isQuoted ? getMessageType(quotedMsg) : '';

    const isMedia = /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(messageType);
    const mime = msg[messageType]?.mimetype || '';

    const isQuotedMedia = isQuoted && /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(quotedType);
    const quotedMime = isQuoted ? (quotedMsg[quotedType]?.mimetype || '') : '';

    const remoteJid = resolveLidToJid(rawRemoteJid);

    return {
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
        contextInfo,
        msg,
        quotedMsg,
        quotedType,
        isMedia,
        mime,
        quotedMime,
        isQuotedMedia,
        mentions: contextInfo.mentionedJid || [],
        isAdmin: false, // Will be set in handler
        isBotAdmin: false, // Will be set in handler
        
        // Helper to parse target JID from various sources
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
            if (targetJid.endsWith('@lid')) return targetJid;
            if (targetJid.endsWith('@g.us')) return targetJid;
            return targetJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
        },

        // Helper to download media from the current or quoted message
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
        react: async (emoji) => sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } })
    };
};

