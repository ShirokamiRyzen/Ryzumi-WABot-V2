import os from 'os';
import fs from 'fs';

import { sizeFormatter } from 'human-readable';
import User from '../../databases/orm/User.js';
import Group from '../../databases/orm/Group.js';
import Setting from '../../databases/orm/Setting.js';

const format = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeros: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

export default {
    command: ['statbot', 'botstat'],
    category: 'misc',
    isRegistered: true,
    description: 'Menampilkan statistik bot secara real-time.',
    async execute(sock, m, msgData) {
        // Fetch Counts
        const userCount = await User.count();
        const groupCount = await Group.count();

        // Fetch Settings
        const [setting] = await Setting.findOrCreate({
            where: { id: 1 },
            defaults: { is_public: true, is_register: true }
        });

        // System Info
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const systemUsedRam = totalRam - freeRam;
        const botUsedRam = process.memoryUsage().rss;
        
        // CPU Info
        const osu = await import('node-os-utils');
        const cpuUsage = await osu.default.cpu.usage();
        const cpus = os.cpus();
        const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
        
        // Baileys Version (Dynamic from package.json)
        const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
        const baileysVersion = pkg.dependencies.baileys.replace(/^[\^~]/, '');

        let statText = `╭─「 *STATISTIK BOT* 」\n`;
        statText += `│ 🏷️ *Versi Baileys:* v${baileysVersion}\n`;
        statText += `│ 👤 *Total User:* ${userCount}\n`;
        statText += `│ 👥 *Total Group:* ${groupCount}\n`;
        statText += `╰─────────────┈\n\n`;

        statText += `╭─「 *PENGATURAN* 」\n`;
        statText += `│ 🌐 *Public Mode:* ${setting.is_public ? '✅ Aktif' : '❌ Mati'}\n`;
        statText += `│ 📝 *Register Mode:* ${setting.is_register ? '✅ Aktif' : '❌ Mati'}\n`;
        statText += `╰─────────────┈\n\n`;

        statText += `╭─「 *SYSTEM USAGE* 」\n`;
        statText += `│ 🧠 *System RAM:* ${format(systemUsedRam)} / ${format(totalRam)}\n`;
        statText += `│ 🤖 *Bot RAM:* ${format(botUsedRam)}\n`;
        statText += `│ ⚡ *CPU Usage:* ${cpuUsage.toFixed(2)}%\n`;
        statText += `│ 🖥️ *CPU Model:* ${cpuModel.trim()}\n`;
        statText += `│ 📈 *OS:* ${os.platform()} ${os.release()}\n`;
        statText += `╰─────────────┈\n\n`;

        statText += `Statistik ini diambil secara real-time dari server Ryzumi. (๑>ᴗ<๑)`;

        await sock.sendMessage(msgData.remoteJid, { text: statText.trim() }, { quoted: m });
    }
};
