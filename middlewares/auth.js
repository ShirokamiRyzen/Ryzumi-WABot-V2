import User from '../databases/orm/User.js';
import Group from '../databases/orm/Group.js';
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
    
    // Bandingkan JID yang sudah di-resolve (senderJid)
    const isOwner = (msgData.senderJid.split(':')[0] === ownerJid.split(':')[0]) || 
                    (msgData.senderJid.split(':')[0] === botJid.split(':')[0]) || 
                    msgData.fromMe;

    if (msgData.isGroup) {
        const metadata = await sock.groupMetadata(msgData.remoteJid);
        const [group] = await Group.findOrCreate({
            where: { jid: msgData.remoteJid },
            defaults: { name: metadata.subject }
        });

        if (group.name !== metadata.subject) {
            await group.update({ name: metadata.subject });
        }

        const participant = metadata.participants.find(p => p.id.split(':')[0] === msgData.senderJid.split(':')[0]);
        msgData.isAdmin = participant?.admin !== null && participant?.admin !== undefined;
    }

    user.isOwner = isOwner;


    return user;
};
