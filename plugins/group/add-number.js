export default {
    command: ['add'],
    category: 'group',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    description: 'Menambahkan anggota baru ke dalam grup',
    async execute(sock, m, msgData) {
        let jids = [];
        
        // Cek jika meng-quote kartu kontak (vcard)
        if (msgData.quotedType === 'contactMessage') {
            const vcard = msgData.quotedMsg.contactMessage.vcard;
            const match = vcard.match(/waid=(\d+)/);
            if (match) jids.push(`${match[1]}@s.whatsapp.net`);
        } 
        // Cek jika meng-quote multi kartu kontak
        else if (msgData.quotedType === 'contactsArrayMessage') {
            const vcards = msgData.quotedMsg.contactsArrayMessage.contacts;
            vcards.forEach(c => {
                const match = c.vcard.match(/waid=(\d+)/);
                if (match) jids.push(`${match[1]}@s.whatsapp.net`);
            });
        }
        // Ambil dari argumen (nomor telepon)
        else if (msgData.args.length > 0) {
            msgData.args.forEach(arg => {
                const number = arg.replace(/[^0-9]/g, '');
                if (number.length >= 10) jids.push(`${number}@s.whatsapp.net`);
            });
        }

        if (jids.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: 'Masukkan nomor telepon atau balas kartu kontak untuk menambahkan anggota.' }, { quoted: m });
        }

        try {
            const response = await sock.groupParticipantsUpdate(msgData.remoteJid, jids, 'add');
            
            for (let res of response) {
                const jid = res.jid;
                const num = jid.split('@')[0];

                if (res.status === '200') {
                    await sock.sendMessage(msgData.remoteJid, { text: `Berhasil menambahkan @${num}` }, { mentions: [jid] });
                } else if (res.status === '403' || res.status === '408' || res.status === '409') {
                    const metadata = await sock.groupMetadata(msgData.remoteJid);
                    const groupName = metadata.subject;
                    const code = await sock.groupInviteCode(msgData.remoteJid);
                    const inviteLink = `https://chat.whatsapp.com/${code}`;
                    
                    await sock.sendMessage(msgData.remoteJid, { 
                        text: `Gagal menambahkan @${num} secara langsung (Status: ${res.status}).\n\nBot telah mengirimkan undangan ke chat pribadi nomor tersebut.`,
                        mentions: [jid]
                    });

                    await sock.sendMessage(jid, { 
                        text: `Halo, kamu diundang untuk bergabung ke grup *${groupName}* melalui link ini:\n\n${inviteLink}`
                    });
                } else {
                    await sock.sendMessage(msgData.remoteJid, { text: `Gagal menambahkan @${num}. Status: ${res.status}` }, { mentions: [jid] });
                }
            }
        } catch (error) {
            console.error('Add Member Error:', error);
            await sock.sendMessage(msgData.remoteJid, { text: `Gagal memproses permintaan: ${error.message}` }, { quoted: m });
        }
    }
};
