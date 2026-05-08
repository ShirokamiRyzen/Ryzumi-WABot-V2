import axios from 'axios';
import mime from 'mime-types';
import { sizeFormatter } from 'human-readable';
import config from '../../config.js';

const formatSize = sizeFormatter({
    std: 'JEDEC', // 'SI' or 'IEC' or 'JEDEC'
    decimalPlaces: 2,
    keepTrailingZeros: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

export default {
    command: ['mega', 'megadl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh file dari Mega.nz.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Link Mega-nya mana Kakak~? Ketik .${msgData.commandName} <url> yaa! (๑>ᴗ<๑)` }, { quoted: m });
        }

        const url = msgData.args[0];
        await msgData.react('⏳');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/mega?url=${encodeURIComponent(url)}`);

            if (!data.result || data.result.length === 0) {
                throw new Error('Maafin Ryzumi kak, datanya nggak ketemu atau link-nya rusak.. (╥﹏╥)');
            }

            const file = data.result[0];
            const readableSize = formatSize(file.size);

            let caption = `--- *MEGA DOWNLOADER* ---\n\n`;
            caption += `📄 *Nama:* ${file.name}\n`;
            caption += `📦 *Ukuran:* ${readableSize}\n`;
            caption += `🆔 *ID:* ${file.id}\n\n`;
            caption += `Sabar ya kak, Ryzumi sedang mendownload filenya buat Kakak~! (˶˃ ᵕ ˂˶)`;

            await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });

            // Download file
            const fileRes = await axios.get(file.link, {
                responseType: 'arraybuffer',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                }
            });

            const buffer = Buffer.from(fileRes.data);
            const mimetype = mime.lookup(file.name) || 'application/octet-stream';

            await sock.sendMessage(msgData.remoteJid, {
                document: buffer,
                mimetype: mimetype,
                fileName: file.name,
                caption: `Ini dia filenya, Kakak~! ✨ (๑>ᴗ<๑)`
            }, { quoted: m });

            await msgData.react('✅');

        } catch (error) {
            console.error('Mega Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gawat kak! Ryzumi gagal download: ${errMsg}.. (⊙_⊙)` }, { quoted: m });
        }
    }
};
