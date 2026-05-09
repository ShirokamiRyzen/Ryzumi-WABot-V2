import moment from 'moment-timezone';

export const logMessage = (sock, msgData) => {
    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
    const botNumber = sock.user?.id?.split(':')[0] || 'Bot';
    const targetNumber = msgData.remoteJid.split('@')[0];
    const senderNumber = msgData.senderJid.split('@')[0];
    
    const type = msgData.messageType || 'unknown';
    
    // Jangan print log untuk sistem WhatsApp untuk menghindari spam
    const protocolTypes = ['protocolMessage', 'senderKeyDistributionMessage', 'messageContextInfo', 'peerDataOperationRequestMessage'];
    if (protocolTypes.includes(type)) return;

    let content = msgData.messageContent;
    if (!content && type !== 'conversation' && type !== 'extendedTextMessage') {
        content = `[Media/Type: ${type}]`;
    }
    if (content.length > 60) {
        content = content.slice(0, 60) + '...';
    }
    content = content.replace(/\n/g, ' ');

    console.log(`\n=========================================`);
    console.log(`[⏰ Waktu]      : ${time}`);
    
    if (msgData.fromMe) {
        console.log(`[🤖 OUTGOING]   : BOT (${botNumber}) ➔ ${targetNumber}`);
        console.log(`[💬 Tipe Pesan] : ${type}`);
        console.log(`[📄 Balasan]    : ${content}`);
    } else {
        const cmd = msgData.commandName ? `.${msgData.commandName}` : '-';
        console.log(`[🤖 Bot]        : ${botNumber}`);
        console.log(`[👤 Pengirim]   : ${senderNumber} (${msgData.pushName})`);
        console.log(`[👥 Chat]       : ${msgData.isGroup ? 'Group' : 'Private'} (${msgData.remoteJid})`);
        console.log(`[💬 Tipe Pesan] : ${type}`);
        console.log(`[⚙️  Command]    : ${cmd}`);
        console.log(`[📄 Isi Pesan]  : ${content}`);
    }
    console.log(`=========================================\n`);
};
