import config from '../config.js';

export const validatePlugin = async (sock, m, msgData, user, group, plugin, setting) => {
    // Jika is_register dimatikan secara global, abaikan plugin register/unregister
    if (!setting.is_register && (plugin.command && (plugin.command.includes('register') || plugin.command.includes('daftar') || plugin.command.includes('unregister')))) {
        return false; // Bengong/Tidak direspon sesuai permintaan
    }

    if (plugin.isPrivate && msgData.isGroup) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_PRIVATE }, { quoted: m });
        return false;
    }

    if (plugin.isGroup && !msgData.isGroup) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_GROUP }, { quoted: m });
        return false;
    }

    // Logic is_register: Jika true, terapkan aturan register. Jika false, bebas akses & limit.
    if (setting.is_register) {
        if (plugin.isRegistered && !user.is_registered && !user.isOwner) {
            await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_REGISTER }, { quoted: m });
            return false;
        }

        if (plugin.limit) {
            const isLimitBypassed = user.isOwner || user.is_premium || (group && !group.is_limited);
            if (user.limit < plugin.limit && !isLimitBypassed) {
                await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_LIMIT }, { quoted: m });
                return false;
            }
            if (!isLimitBypassed) {
                user.limit -= plugin.limit;
                await user.save();
            }
        }
    }

    if (plugin.isAdmin && !msgData.isAdmin && !user.isOwner) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_ADMIN }, { quoted: m });
        return false;
    }

    if (plugin.isBotAdmin && !msgData.isBotAdmin) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_BOTADMIN }, { quoted: m });
        return false;
    }

    if (plugin.isOwner && !user.isOwner) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_OWNER }, { quoted: m });
        return false;
    }

    if (plugin.isPremium && !user.is_premium && !user.isOwner) {
        await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_PREMIUM }, { quoted: m });
        return false;
    }

    return true;
};
