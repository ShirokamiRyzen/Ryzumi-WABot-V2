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
    const keys = Object.keys(msg);
    if (keys.length === 0) return '';
    
    // Prioritaskan tipe pesan asli daripada metadata Baileys
    let type = keys[0];
    if ((type === 'senderKeyDistributionMessage' || type === 'messageContextInfo') && keys.length > 1) {
        type = keys[1];
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
    
    // Support for Buttons & Interactive Messages
    if (messageType === 'buttonsResponseMessage') return msg.buttonsResponseMessage?.selectedButtonId || '';
    if (messageType === 'listResponseMessage') return msg.listResponseMessage?.singleSelectReply?.selectedRowId || '';
    if (messageType === 'templateButtonReplyMessage') return msg.templateButtonReplyMessage?.selectedId || '';
    if (messageType === 'interactiveResponseMessage') {
        const body = JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || '{}');
        return body.id || '';
    }

    return '';
};
