import axios from 'axios';
import mime from 'mime-types';
import config from '../../config.js';

export default {
    command: ['mediafire', 'mfdl', 'mf'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh file dari Mediafire.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Link Mediafire-nya mana Kakak~? Ketik .${msgData.commandName} <url> yaa! (๑>ᴗ<๑)` }, { quoted: m });
        }

        const url = msgData.args[0];
        await msgData.react('⏳');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/mediafire?url=${encodeURIComponent(url)}`);

            if (!data.status || !data.data || !data.data.downloadUrl) {
                throw new Error(data.message || 'Maafin Ryzumi kak, datanya nggak ketemu atau link-nya rusak.. (╥﹏╥)');
            }

            const file = data.data;
            
            let caption = `--- *MEDIAFIRE DOWNLOADER* ---\n\n`;
            caption += `📄 *Nama:* ${file.filename}\n`;
            caption += `📦 *Ukuran:* ${file.filesize}\n\n`;
            caption += `Sabar ya kak, Ryzumi sedang mendownload filenya buat Kakak~! (˶˃ ᵕ ˂˶)`;

            await sock.sendMessage(msgData.remoteJid, { text: caption }, { quoted: m });

            // Download file
            const fileRes = await axios.get(file.downloadUrl, {
                responseType: 'arraybuffer',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                }
            });

            const buffer = Buffer.from(fileRes.data);
            const mimetype = mime.lookup(file.filename) || 'application/octet-stream';

            await sock.sendMessage(msgData.remoteJid, {
                document: buffer,
                mimetype: mimetype,
                fileName: file.filename,
                caption: `Ini dia filenya, Kakak~! ✨ (๑>ᴗ<๑)`
            }, { quoted: m });

            await msgData.react('✅');

        } catch (error) {
            console.error('Mediafire Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gawat kak! Ryzumi gagal download: ${errMsg}.. (⊙_⊙)` }, { quoted: m });
        }
    }
};
