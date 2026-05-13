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
        
        // CPU Usage (Manual calculation to avoid library interop issues)
        const cpus = os.cpus();
        const cpuUsage = await new Promise((resolve) => {
            const startStats = os.cpus().map(cpu => cpu.times);
            setTimeout(() => {
                const endStats = os.cpus().map(cpu => cpu.times);
                const totalUsage = endStats.reduce((acc, end, i) => {
                    const start = startStats[i];
                    const totalEnd = Object.values(end).reduce((a, b) => a + b, 0);
                    const totalStart = Object.values(start).reduce((a, b) => a + b, 0);
                    const idleEnd = end.idle;
                    const idleStart = start.idle;
                    return acc + (1 - (idleEnd - idleStart) / (totalEnd - totalStart));
                }, 0);
                resolve((totalUsage / cpus.length) * 100);
            }, 100);
        });




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
