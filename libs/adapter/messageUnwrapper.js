export const unwrapMessage = (msg) => {
    if (!msg) return {};
    let unwrapped = msg;
    if (unwrapped.ephemeralMessage) unwrapped = unwrapped.ephemeralMessage.message;
    if (unwrapped.viewOnceMessage) unwrapped = unwrapped.viewOnceMessage.message;
    if (unwrapped.viewOnceMessageV2) unwrapped = unwrapped.viewOnceMessageV2.message;
    if (unwrapped.viewOnceMessageV2Extension) unwrapped = unwrapped.viewOnceMessageV2Extension.message;
    if (unwrapped.documentWithCaptionMessage) unwrapped = unwrapped.documentWithCaptionMessage.message;
    return unwrapped || {};
};

export const getMessageType = (msg) => {
    if (!msg) return '';
    let type = Object.keys(msg)[0] || '';
    if (type === 'senderKeyDistributionMessage' || type === 'messageContextInfo') {
        type = Object.keys(msg)[1] || type;
    }
    return type;
};

export const getMessageContent = (msg, messageType) => {
    if (!msg) return '';
    if (messageType === 'conversation') return msg.conversation || '';
    if (messageType === 'extendedTextMessage') return msg.extendedTextMessage?.text || '';
    if (messageType === 'imageMessage') return msg.imageMessage?.caption || '';
    if (messageType === 'videoMessage') return msg.videoMessage?.caption || '';
    if (messageType === 'documentMessage') return msg.documentMessage?.caption || '';
    return '';
};
