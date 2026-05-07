import moment from 'moment-timezone';
import config from '../../config.js';

export default {
    command: ['menu', 'help'],
    category: 'main',
    description: 'Menampilkan daftar menu bot dengan informasi lengkap dan tampilan cantik.',
    async execute(sock, m, msgData, user, plugins) {
        const name = user.name || msgData.pushName || 'Kakak manis';
        const jid = msgData.senderJid.split('@')[0];
        const premium = user.is_premium ? 'Premium VIP 💎' : 'Gratis 🌸';
        const limit = user.limit;
        const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const date = moment.tz('Asia/Jakarta').format('DD MMMM YYYY');
        
        // Greeting dinamis sesuai jam (WIB)
        const hour = moment.tz('Asia/Jakarta').hour();
        let greeting = 'Konbanwa'; 
        if (hour >= 4 && hour < 11) greeting = 'Ohayou';
        else if (hour >= 11 && hour < 15) greeting = 'Konichiwa';
        else if (hour >= 15 && hour < 19) greeting = 'Konbanwa';

        const categories = {};

        // Group plugins by category
        for (const plugin of plugins) {
            if (!plugin.command) continue;
            const cat = plugin.category || 'Lainnya';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(plugin.command[0]);
        }

        let menuText = `${greeting} ${name}~! (˶˃ ᵕ ˂˶)\n`;
        menuText += `Aku Ryzumi-Bot, asisten pribadi kakak~ 🌸✨\n\n`;

        menuText += `╭─「 *STATUS KAKAK* 」\n`;
        menuText += `│ 👤 *Nama:* ${name}\n`;
        menuText += `│ 📱 *Nomor:* ${jid}\n`;
        menuText += `│ 💎 *Status:* ${premium}\n`;
        menuText += `│ 🎫 *Limit:* ${limit}\n`;
        menuText += `╰─────────────┈\n\n`;

        menuText += `╭─「 *WAKTU & TANGGAL* 」\n`;
        menuText += `│ 📅 *Tanggal:* ${date}\n`;
        menuText += `│ ⏰ *Waktu:* ${time}\n`;
        menuText += `╰─────────────┈\n\n`;

        for (const [cat, commands] of Object.entries(categories)) {
            const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
            menuText += `୨୧ [ *${catName}* ] ୨୧\n`;

            const uniqueCmds = [...new Set(commands)];
            for (const cmd of uniqueCmds) {
                menuText += `  🌸 .${cmd}\n`;
            }
            menuText += '\n';
        }

        menuText += `\n*Note:* Gunakan bot dengan bijak yaa kak~ (๑>ᴗ<๑)`;

        // Fake Contact Card (fkon)
        const fkon = {
            key: {
                fromMe: false,
                participant: `${msgData.senderJid.split('@')[0]}@s.whatsapp.net`,
                ...(msgData.remoteJid ? { remoteJid: 'status@broadcast' } : {})
            },
            message: {
                contactMessage: {
                    displayName: name,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${msgData.senderJid.split('@')[0]}:${msgData.senderJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                    verified: true
                }
            }
        };

        await sock.sendMessage(msgData.remoteJid, {
            text: menuText.trim(),
            contextInfo: {
                mentionedJid: [msgData.senderJid],
                externalAdReply: {
                    title: config.BOT_NAME,
                    body: 'Daftar Menu Bot Terlengkap ✨',
                    mediaType: 1,
                    previewType: 'NONE',
                    renderLargerThumbnail: true,
                    showAdAttribution: false,
                    sourceUrl: config.SOC_WA_GROUP,
                    thumbnailUrl: config.RYZUMI_BANNER,
                }
            }
        }, { quoted: fkon });
    }
};
