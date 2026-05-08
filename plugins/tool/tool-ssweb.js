import axios from 'axios';
import config from '../../config.js';

export default {
    command: ['ssweb', 'sspc', 'sshp'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mengambil screenshot dari sebuah website',
    async execute(sock, m, msgData) {
        let url = msgData.args[0];

        if (!url) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Mana link website yang mau di-screenshot kak? (｡T ω T｡)\n\nContoh: \`.${msgData.commandName} https://google.com\``
            }, { quoted: m });
        }

        // Normalisasi URL kak biar nggak error~ (˶˃ ᵕ ˂˶)
        if (!/^https?:\/\//.test(url)) url = 'https://' + url;

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            // Tentukan modenya berdasarkan perintah kakak~ (๑>ᴗ<๑)
            let mode = 'desktop';
            if (msgData.commandName === 'sshp') mode = 'handphone';

            const apiUrl = `${config.API_RYZUMI}/api/tool/ssweb`;
            const response = await axios.get(apiUrl, {
                params: { url, mode },
                responseType: 'arraybuffer'
            });

            if (!response.data || response.data.length < 100) {
                throw new Error('Screenshot-nya kosong atau gagal diproses..');
            }

            const caption = `Horeee! Ini hasil screenshot website buat kakak~ (˶˃ ᵕ ˂˶)\n\n*URL:* ${url}\n*Mode:* ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

            await sock.sendMessage(msgData.remoteJid, {
                image: Buffer.from(response.data),
                caption: caption
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('SSWeb Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal ambil screenshot websitenya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
