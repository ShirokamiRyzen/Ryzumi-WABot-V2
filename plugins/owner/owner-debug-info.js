import { resolveLidToJid } from '../../libs/lid-resolver.js';

export default {
    command: ['debug'],
    category: 'owner',
    isOwner: true,
    description: 'Menampilkan data debug dari pesan (termasuk info JID, tipe pesan, dll)',
    async execute(sock, m, msgData) {
        // Cek apakah pesan meng-quote (balas) pesan lain
        const contextInfo = m.message?.extendedTextMessage?.contextInfo;
        const isQuoted = !!contextInfo?.quotedMessage;

        let debugData = {};

        if (isQuoted) {
            // Ambil data dari pesan yang di-quote dan resolve LID-nya
            debugData = {
                type: 'Quoted Message',
                jid: resolveLidToJid(contextInfo.participant, sock),
                messageId: contextInfo.stanzaId,
                messageType: Object.keys(contextInfo.quotedMessage || {})[0] || 'unknown',
                raw: contextInfo.quotedMessage
            };
        } else {
            // Ambil data dari pesan milik user (owner) yang mengeksekusi command
            debugData = {
                type: 'Current User Message',
                jid: msgData.senderJid,
                pushName: m.pushName || 'Tidak diketahui',
                messageId: m.key.id,
                messageType: Object.keys(m.message || {})[0] || 'unknown',
                raw: m
            };
        }

        let rawString = JSON.stringify(debugData.raw, null, 2) || '';
        // Membatasi output string jika terlalu panjang agar tidak error saat dikirim
        if (rawString.length > 3000) {
            rawString = rawString.substring(0, 3000) + '\n... [Data terpotong karena terlalu panjang]';
        }

        let text = `--- DEBUG INFO ---\n\n` +
            `Target: ${debugData.type}\n` +
            `JID: ${debugData.jid}\n`;

        if (debugData.pushName) {
            text += `PushName: ${debugData.pushName}\n`;
        }

        text += `Message ID: ${debugData.messageId}\n` +
            `Message Type: ${debugData.messageType}\n\n` +
            `Raw JSON:\n\`\`\`json\n${rawString}\n\`\`\``;

        await sock.sendMessage(m.key.remoteJid, { text: text.trim() }, { quoted: m });
    }
};
