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

        // System Info
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const systemUsedRam = totalRam - freeRam;
        const botUsedRam = process.memoryUsage().rss;
        
        // CPU Usage (menggunakan node-os-utils)
        const osu = await import('node-os-utils');
        const cpuUsage = await osu.default.cpu.usage();

        let pingText = `*Pong!!*\n\n`;
        pingText += `*Latensi:* ${initialPing} ms\n`;
        pingText += `*CPU Usage:* ${cpuUsage.toFixed(2)}%\n`;
        pingText += `*System RAM:* ${format(systemUsedRam)} / ${format(totalRam)}\n`;
        pingText += `*Bot RAM:* ${format(botUsedRam)}\n`;
        pingText += `*Platform:* ${os.platform()}\n\n`;
        pingText += `Bot aktif dan siap melayani kakak~! (๑>ᴗ<๑)`;

        await sock.sendMessage(msgData.remoteJid, { text: pingText.trim() }, { quoted: m });
    }
};
