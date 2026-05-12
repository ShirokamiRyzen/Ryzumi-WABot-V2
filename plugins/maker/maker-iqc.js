import axios from 'axios';
import config from '../../config.js';
import { getMessageContent } from '../../libs/adapter/messageUnwrapper.js';

export default {
    command: ['iqc'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan chat bubble tapi dalam bentuk gambar (bukan stiker).',
    async execute(sock, m, msgData) {
        // Ambil teks dari argumen atau dari pesan yang di-reply
        let text = msgData.args.join(' ');
        if (!text && msgData.isQuoted) {
            text = getMessageContent(msgData.quotedMsg, msgData.quotedType);
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_QUOTED }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const params = new URLSearchParams({ text: text });
            const url = `${config.API_RYZUMI}/api/image/iqc?${params.toString()}`;

            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            // Cek apakah responnya beneran gambar
            const contentType = response.headers['content-type'] || '';
            if (!contentType.includes('image')) {
                const errorText = Buffer.from(response.data).toString();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || 'API gagal memproses gambar');
                } catch (e) {
                    throw new Error('API memberikan respon tidak valid (bukan gambar)');
                }
            }

            const buffer = Buffer.from(response.data);

            // Kirim sebagai gambar (png)
            await sock.sendMessage(msgData.remoteJid, {
                image: buffer,
                caption: `Nih kak, gelembung chat-nya dalam versi gambar! Cantik kan? (๑>ᴗ<๑)`
            }, { quoted: m });

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('IQC Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Aduuh gawat! Ryzumi gagal bikin gambarnya kak: ${error.message}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
