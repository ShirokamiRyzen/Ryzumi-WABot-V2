import User from '../databases/orm/User.js';
import config from '../config.js';

export const processAuth = async (sock, msgData) => {
    const [user] = await User.findOrCreate({
        where: { jid: msgData.senderJid },
        defaults: {
            name: msgData.pushName,
            is_registered: false
        }
    });

    if (user.name !== msgData.pushName && msgData.pushName) {
        await user.update({ name: msgData.pushName });
    }

    const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const isOwner = (msgData.senderJid === ownerJid) || (msgData.senderJid === botJid) || msgData.fromMe;

    user.isOwner = isOwner;


    return user;
};
