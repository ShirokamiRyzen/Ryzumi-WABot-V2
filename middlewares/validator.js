import config from '../config.js';

export const validatePlugin = async (sock, m, msgData, user, plugin) => {
    if (plugin.isPrivate && msgData.isGroup) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_PRIVATE }, { quoted: m });
        return false;
    }

    if (plugin.isGroup && !msgData.isGroup) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_GROUP }, { quoted: m });
        return false;
    }

    if (plugin.isRegistered && !user.is_registered && !user.isOwner) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_REGISTER }, { quoted: m });
        return false;
    }

    if (plugin.limit) {
        const isLimitBypassed = user.isOwner || user.is_premium;

        if (user.limit < plugin.limit && !isLimitBypassed) {
            await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_LIMIT }, { quoted: m });
            return false;
        }
        if (!isLimitBypassed) {
            user.limit -= plugin.limit;
            await user.save();
        }
    }

    return true;
};
