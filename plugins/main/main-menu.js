import moment from 'moment-timezone';
import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['menu', 'help'],
    category: 'main',
    description: 'Menampilkan daftar menu bot dengan informasi lengkap dan tampilan cantik.',
    async execute(sock, m, msgData, user, group, plugins) {
        const name = user.name || msgData.pushName || 'Kakak manis';
        const jid = msgData.senderJid.split('@')[0];
        const premium = user.is_premium ? 'Premium VIP 💎' : 'Gratis 🌸';
        const limit = (group && !group.is_limited) ? 'Unlimited ✨' : user.limit;
        const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const date = moment.tz('Asia/Jakarta').format('DD MMMM YYYY');
        const arg = msgData.args[0]?.toLowerCase();

        // Greeting dinamis sesuai jam (WIB)
        const hour = moment.tz('Asia/Jakarta').hour();
        let greeting = 'Konbanwa';
        if (hour >= 4 && hour < 11) greeting = 'Ohayou';
        else if (hour >= 11 && hour < 15) greeting = 'Konichiwa';
        else if (hour >= 15 && hour < 19) greeting = 'Konbanwa';

        const categories = {};
        for (const plugin of plugins) {
            if (!plugin.command) continue;
            const cat = plugin.category?.toLowerCase() || 'lainnya';
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

        if (!arg) {
            // Tampilan Kategori Saja
            menuText += `*DAFTAR KATEGORI MENU:*\n\n`;
            Object.keys(categories).sort().forEach(cat => {
                menuText += `  🌸 ${cat}\n`;
            });
            menuText += `\n  ✨ .menu all (Tampilkan semua)\n\n`;
            menuText += `Silakan ketik *.menu [nama_kategori]* untuk melihat daftar perintahnya, atau ketik *.menu all* untuk melihat semua menu yaa kak! (๑>ᴗ<๑)`;
        } else if (arg === 'all') {
            // Tampilan Semua Command
            for (const [cat, commands] of Object.entries(categories).sort()) {
                const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
                menuText += `୨୧ [ *${catName}* ] ୨୧\n`;
                const uniqueCmds = [...new Set(commands)];
                for (const cmd of uniqueCmds) {
                    menuText += `  🌸 .${cmd}\n`;
                }
                menuText += '\n';
            }
            menuText += `*Note:* Gunakan bot dengan bijak yaa kak~ (๑>ᴗ<๑)`;
        } else if (categories[arg]) {
            // Tampilan Per Kategori
            const catName = arg.charAt(0).toUpperCase() + arg.slice(1);
            menuText += `୨୧ [ *${catName}* ] ୨୧\n`;
            const uniqueCmds = [...new Set(categories[arg])];
            for (const cmd of uniqueCmds) {
                menuText += `  🌸 .${cmd}\n`;
            }
            menuText += `\n*Note:* Gunakan bot dengan bijak yaa kak~ (๑>ᴗ<๑)`;
        } else {
            // Jika kategori tidak ditemukan
            menuText += `Aduuh! Kategori *${arg}* nggak Ryzumi temukan kak.. (｡T ω T｡)\n\nKetik \`.menu\` saja untuk melihat daftar kategori yang tersedia yaa!`;
        }


        // Fake Contact Card (fkon)
        const fkon = {
            key: {
                fromMe: false,
                participant: `${msgData.senderJid.split('@')[0]}@s.whatsapp.net`,
                remoteJid: msgData.remoteJid
            },
            message: {
                contactMessage: {
                    displayName: name,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${msgData.senderJid.split('@')[0]}:${msgData.senderJid.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                    verified: true
                }
            }
        };

        // Ambil banner sebagai buffer untuk preview (Landscape)
        let thumbBuffer;
        try {
            const res = await axios.get(config.RYZUMI_BANNER, { responseType: 'arraybuffer' });
            thumbBuffer = Buffer.from(res.data);
        } catch {
            thumbBuffer = null;
        }

        await sock.sendMessage(msgData.remoteJid, {
            text: menuText.trim(),
            contextInfo: {
                mentionedJid: [msgData.senderJid],
                //externalAdReply: {
                //    title: 'Ryzumi Starlette',
                //    body: 'Hallom, Apa Kabar Kak?',
                //    mediaType: 1,
                //    renderLargerThumbnail: true,
                //    sourceUrl: config.SOC_WEBSITE,
                //    thumbnail: thumbBuffer,
                //    thumbnailUrl: config.SOC_WEBSITE
                //}
            }
        }, { quoted: fkon });
    }
};
