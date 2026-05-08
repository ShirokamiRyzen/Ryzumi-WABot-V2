import axios from 'axios';
import mime from 'mime-types';
import config from '../../config.js';

export default {
    command: ['kraken', 'kfiles', 'krakenfiles', 'krakenfile'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh file dari Krakenfiles.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Link Krakenfiles-nya mana Kakak~? Ketik .${msgData.commandName} <url> yaa! (๑>ᴗ<๑)` }, { quoted: m });
        }

        const url = msgData.args[0];
        await msgData.react('⏳');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/kfiles?url=${encodeURIComponent(url)}`);

            if (!data || !data.metadata || !data.metadata.download) {
                throw new Error('Maafin Ryzumi kak, datanya nggak ketemu atau link-nya rusak.. (╥﹏╥)');
            }

            const metadata = data.metadata;
            const headers = data.headers;

            // Perbaiki URL jika ada double protocol dari API
            const downloadUrl = metadata.download.replace('https:https://', 'https://');

            let caption = `--- *KRAKENFILES DOWNLOADER* ---\n\n`;
            caption += `📄 *Nama:* ${metadata.filename}\n`;
            caption += `📦 *Ukuran:* ${metadata.file_size}\n`;
            caption += `📅 *Upload:* ${metadata.upload_date}\n`;
            caption += `📂 *Tipe:* ${metadata.type}\n`;
            caption += `👀 *Views:* ${metadata.views}\n`;
            caption += `📥 *Downloads:* ${metadata.downloads}\n\n`;
            caption += `Sabar ya kak, Ryzumi sedang mendownload filenya buat Kakak~! (˶˃ ᵕ ˂˶)`;

            await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });

            // Download file menggunakan headers yang diberikan API
            const fileRes = await axios.get(downloadUrl, {
                headers: headers,
                responseType: 'arraybuffer',
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            const buffer = Buffer.from(fileRes.data);
            const mimetype = mime.lookup(metadata.filename) || 'application/octet-stream';

            await sock.sendMessage(msgData.remoteJid, {
                document: buffer,
                mimetype: mimetype,
                fileName: metadata.filename,
                caption: `Ini dia filenya, Kakak~! ✨ (๑>ᴗ<๑)`
            }, { quoted: m });

            await msgData.react('✅');

        } catch (error) {
            console.error('Krakenfiles Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gawat kak! Ryzumi gagal download: ${errMsg}.. (⊙_⊙)` }, { quoted: m });
        }
    }
};
