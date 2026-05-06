import { resolveLidToJid } from '../lid-resolver.js';

export const extractMessageData = (m, sock) => {
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const rawRemoteJid = m.key.remoteJid;
    const fromMe = m.key.fromMe;
    
    // Resolve LID menjadi JID untuk remote dan sender
    const remoteJid = isGroup ? rawRemoteJid : resolveLidToJid(rawRemoteJid);
    
    let rawSenderJid;
    if (fromMe) {
        // Jika pesan berasal dari bot itu sendiri, pengirim aslinya adalah bot JID
        const botJid = sock?.user?.id?.split(':')[0] + '@s.whatsapp.net';
        // Fallback jika sock belum siap (sangat jarang terjadi)
        rawSenderJid = botJid || (isGroup ? (m.key.participant || rawRemoteJid) : rawRemoteJid);
    } else {
        // Jika dari user lain
        rawSenderJid = isGroup ? (m.key.participant || rawRemoteJid) : rawRemoteJid;
    }
    
    const senderJid = resolveLidToJid(rawSenderJid);
    
    // Unwrap pesan jika terbungkus (ephemeral, viewOnce, documentWithCaption)
    let msg = m.message || {};
    if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message;
    if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    if (msg.viewOnceMessageV2Extension) msg = msg.viewOnceMessageV2Extension.message;
    if (msg.documentWithCaptionMessage) msg = msg.documentWithCaptionMessage.message;

    let messageType = Object.keys(msg)[0] || '';
    if (messageType === 'senderKeyDistributionMessage' || messageType === 'messageContextInfo') {
        messageType = Object.keys(msg)[1] || messageType;
    }

    let messageContent = '';
    if (messageType === 'conversation') messageContent = msg.conversation;
    else if (messageType === 'extendedTextMessage') messageContent = msg.extendedTextMessage?.text || '';
    else if (messageType === 'imageMessage') messageContent = msg.imageMessage?.caption || '';
    else if (messageType === 'videoMessage') messageContent = msg.videoMessage?.caption || '';
    else if (messageType === 'documentMessage') messageContent = msg.documentMessage?.caption || '';
    else messageContent = '';

    let commandName = '';
    let args = [];
    if (messageContent.startsWith('.')) {
        args = messageContent.slice(1).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
    }

    const contextInfo = msg[messageType]?.contextInfo || {};
    const isQuoted = !!contextInfo.quotedMessage;
    
    // Unwrap quoted message
    let quotedMsg = isQuoted ? contextInfo.quotedMessage : null;
    if (quotedMsg) {
        if (quotedMsg.ephemeralMessage) quotedMsg = quotedMsg.ephemeralMessage.message;
        if (quotedMsg.viewOnceMessage) quotedMsg = quotedMsg.viewOnceMessage.message;
        if (quotedMsg.viewOnceMessageV2) quotedMsg = quotedMsg.viewOnceMessageV2.message;
        if (quotedMsg.viewOnceMessageV2Extension) quotedMsg = quotedMsg.viewOnceMessageV2Extension.message;
        if (quotedMsg.documentWithCaptionMessage) quotedMsg = quotedMsg.documentWithCaptionMessage.message;
    }

    const quotedType = isQuoted ? Object.keys(quotedMsg)[0] : '';
    if (quotedType === 'senderKeyDistributionMessage' || quotedType === 'messageContextInfo') {
        // Fallback untuk quoted yang memiliki array tipe
    }

    // Media Check
    const isMedia = /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(messageType);
    const mime = msg[messageType]?.mimetype || '';

    const isQuotedMedia = isQuoted && /imageMessage|videoMessage|audioMessage|stickerMessage|documentMessage/.test(quotedType);
    const quotedMime = isQuoted ? (quotedMsg[quotedType]?.mimetype || '') : '';

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
        msg,           // Raw unwrapped message
        quotedMsg,     // Raw unwrapped quoted message
        quotedType,
        isMedia,
        mime,
        isQuotedMedia,
        quotedMime
    };
};
