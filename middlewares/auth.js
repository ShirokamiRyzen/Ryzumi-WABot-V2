import User from '../databases/orm/User.js';
import Group from '../databases/orm/Group.js';
import config from '../config.js';

export const processAuth = async (sock, msgData) => {
    // Jangan simpan grup atau status broadcast ke tabel User
    if (msgData.senderJid.endsWith('@g.us') || msgData.senderJid === 'status@broadcast') {
        return { is_registered: false, is_premium: false, is_banned: false, limit: 0 };
    }

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
    const botJid = sock.user?.id?.split(':')[0].split('@')[0] + '@s.whatsapp.net';
    
    // Bandingkan JID yang sudah di-resolve (senderJid)
    const isOwner = (msgData.senderJid.split(':')[0].split('@')[0] === ownerJid.split(':')[0].split('@')[0]) || 
                    (msgData.senderJid.split(':')[0].split('@')[0] === botJid.split(':')[0].split('@')[0]) || 
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

        // Fungsi pembantu untuk normalisasi JID ke format nomor murni
        const jidToNum = (jid) => jid?.split('@')[0].split(':')[0];
        const normalizedSender = jidToNum(msgData.senderJid);
        const normalizedBot = jidToNum(botJid);

        const participant = metadata.participants.find(p => jidToNum(p.id) === normalizedSender);
        msgData.isAdmin = participant?.admin !== null && participant?.admin !== undefined;

        const botParticipant = metadata.participants.find(p => jidToNum(p.id) === normalizedBot);
        msgData.isBotAdmin = botParticipant?.admin !== null && botParticipant?.admin !== undefined;
    }

    user.isOwner = isOwner;


    return user;
};
