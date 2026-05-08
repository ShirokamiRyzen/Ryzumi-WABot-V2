import User from '../databases/orm/User.js';
import Group from '../databases/orm/Group.js';
import config from '../config.js';
import { resolveLidToJid } from '../libs/lid-resolver.js';
import { getGroupMetadata, setGroupMetadata } from '../libs/groupCache.js';

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

    user.isOwner = isOwner;
    
    let group = null;
    if (msgData.isGroup) {
        let metadata = getGroupMetadata(msgData.remoteJid);
        
        // Jika tidak ada di cache, coba ambil dari database dulu sebagai cadangan (biar cepet)
        let dbGroup = await Group.findOne({ where: { jid: msgData.remoteJid } });

        if (!metadata) {
            try {
                // Tambahkan timeout yang lebih singkat agar tidak membuat user menunggu lama
                const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), ms));
                metadata = await Promise.race([
                    sock.groupMetadata(msgData.remoteJid),
                    timeout(2000) // 2 detik saja, lebih dari itu kelamaan
                ]);
                
                setGroupMetadata(msgData.remoteJid, metadata);
            } catch (err) {
                // Jika gagal fetch metadata (timeout/error), gunakan data dari DB atau dummy
                metadata = {
                    id: msgData.remoteJid,
                    subject: dbGroup?.name || 'Unknown Group',
                    participants: [] // Fitur admin mungkin tidak jalan di command pertama jika ini terjadi
                };
            }
        }

        const [groupData, created] = await Group.findOrCreate({
            where: { jid: msgData.remoteJid },
            defaults: { name: metadata.subject }
        });

        group = groupData;

        if (!created && group.name !== metadata.subject && metadata.subject !== 'Unknown Group') {
            await group.update({ name: metadata.subject });
        }

        // Fungsi pembantu untuk normalisasi JID ke format nomor murni
        const jidToNum = (jid) => jid?.split('@')[0].split(':')[0];
        const normalizedSender = jidToNum(msgData.senderJid);
        const normalizedBot = jidToNum(botJid);

        // Ambil ID mentah untuk perbandingan cadangan
        const botId = sock.user?.id;
        const botLid = sock.user?.lid;

        const participant = metadata.participants.find(p => 
            p.id === msgData.senderJid || 
            jidToNum(resolveLidToJid(p.id)) === normalizedSender
        );
        msgData.isAdmin = participant?.admin !== null && participant?.admin !== undefined;

        const botParticipant = metadata.participants.find(p => 
            p.id === botId || 
            p.id === botLid || 
            jidToNum(resolveLidToJid(p.id)) === normalizedBot
        );
        msgData.isBotAdmin = botParticipant?.admin !== null && botParticipant?.admin !== undefined;
    }

    return { user, group };
};

