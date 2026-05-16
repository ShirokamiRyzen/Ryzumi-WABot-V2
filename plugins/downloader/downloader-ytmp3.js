import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import config from '../../config.js';

const streamPipeline = promisify(pipeline);

export default {
    command: ['ytmp3', 'ytaudio', 'yta'],
    category: 'downloader',
    isRegistered: true,
    limit: 3,
    description: 'Mengunduh audio dari YouTube.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Duhh Kakak lupa ya? Masukkan link YouTube-nya yaa! Contoh: .${msgData.commandName} <url> (˶˃ ᵕ ˂˶)`);
        }

        const videoUrl = msgData.args[0];
        await msgData.react('🕓');

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`);

            if (!data || !data.url) {
                throw new Error('Yahhh... Link audionya nggak ketemu di server Ryzumi (╥﹏╥)');
            }

            const { title, author, lengthSeconds, views, uploadDate, thumbnail } = data;
            const safeTitle = (title || 'audio').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);
            const tmpDir = path.join(process.cwd(), 'tmp');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const filePath = path.join(tmpDir, `${Date.now()}_${safeTitle}.mp3`);

            // Download audio file to tmp
            const audioResponse = await axios({
                method: 'get',
                url: data.url,
                responseType: 'stream'
            });

            await streamPipeline(audioResponse.data, fs.createWriteStream(filePath));

            // Fetch thumbnail for adReply
            /* let thumbBuffer = null;
            if (thumbnail) {
                try {
                    const res = await axios.get(thumbnail, { responseType: 'arraybuffer' });
                    thumbBuffer = Buffer.from(res.data);
                } catch (e) {
                    console.error('Failed to fetch thumbnail:', e.message);
                }
            } */

            const caption = `Ini kak audionya buat Kakak~! @${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +
                `🎵 *Title:* ${title}\n` +
                `👤 *Author:* ${author}\n` +
                `⏳ *Duration:* ${lengthSeconds} sec\n` +
                `👀 *Views:* ${views}\n` +
                `📅 *Uploaded:* ${uploadDate}\n\n`;

            // Kirim file audio sebagai dokumen
            await sock.sendMessage(msgData.remoteJid, {
                document: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: `${safeTitle}.mp3`,
                caption: caption,
                mentions: [msgData.senderJid],
                /* contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: 'Ryzumi YouTube Downloader',
                        mediaType: 2,
                        sourceUrl: videoUrl,
                        thumbnail: thumbBuffer
                    }
                } */
            }, { quoted: m });

            // Hapus file sementara
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('YTMP3 Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Gawat kak! Gagal unduh audio: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
