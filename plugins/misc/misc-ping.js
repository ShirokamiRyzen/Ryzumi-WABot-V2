import os from 'os';
import { sizeFormatter } from 'human-readable';

const format = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeros: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

export default {
    command: ['ping', 'p'],
    category: 'misc',
    description: 'Menampilkan latensi respon bot dan penggunaan sistem.',
    async execute(sock, m, msgData) {
        const start = Date.now();
        const initialPing = (start - (m.messageTimestamp * 1000)).toFixed(0);

        const usedRam = process.memoryUsage().rss;
        const totalRam = os.totalmem();

        let pingText = `*Pong!!*\n\n`;
        pingText += `*Latensi:* ${initialPing} ms\n`;
        pingText += `*RAM Usage:* ${format(usedRam)} / ${format(totalRam)}\n`;
        pingText += `*Platform:* ${os.platform()}\n\n`;
        pingText += `Bot aktif dan siap melayani kakak~! (๑>ᴗ<๑)`;

        await sock.sendMessage(msgData.remoteJid, { text: pingText.trim() }, { quoted: m });
    }
};
