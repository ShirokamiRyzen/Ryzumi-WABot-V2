import { resolveLidToJid } from '../lid-resolver.js';
import { unwrapMessage, getMessageType, getMessageContent } from './messageUnwrapper.js';

export const extractMessageData = (m, sock) => {
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const rawRemoteJid = m.key.remoteJid;
    const fromMe = m.key.fromMe;
    const botJid = sock?.user?.id?.split(':')[0] + '@s.whatsapp.net';

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
        isAdmin: false, // Will be set in handler
        reply: async (text) => sock.sendMessage(remoteJid, { text }, { quoted: m }),
        react: async (emoji) => sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } })
    };
};

