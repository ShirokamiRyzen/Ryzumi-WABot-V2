import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';

export default {
    command: ['ytmp4', 'ytvideo', 'ytv'],
    category: 'downloader',
    isRegistered: true,
    limit: 5,
    description: 'Mengunduh video dari YouTube dengan pilihan resolusi.',
    async execute(sock, m, msgData) {
        if (!msgData.args[0]) {
            return msgData.reply(`Umm... Kakak lupa masukkan link YouTube-nya ya? Ketik .${msgData.commandName} <url> [resolusi] yaa~ (˶˃ ᵕ ˂˶)`);
        }

        const videoUrl = msgData.args[0];
        // Jika argumen kedua tidak ada, default ke 480p. Jika ada angka saja (misal 720), tambahkan 'p'.
        let resolution = msgData.args[1] || '480p';
        if (/^\d+$/.test(resolution)) resolution += 'p';

        await msgData.react('🕓');

        try {
            const apiUrl = `${config.API_RYZUMI}/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${resolution}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.url) {
                throw new Error('Yahhh... Link videonya nggak ketemu di server Ryzumi (╥﹏╥)');
            }

            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const safeTitle = (data.title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);
            const filenameId = `${Date.now()}`;
            const filePath = path.join(tmpDir, `${filenameId}.mp4`);
            const fixedFilePath = path.join(tmpDir, `${filenameId}_fixed.mp4`);

            // Download video stream to tmp
            const writer = fs.createWriteStream(filePath);
            const downloadResponse = await axios({
                url: data.url,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                }
            });

            downloadResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Fix video compatibility using ffmpeg
            await new Promise((resolve, reject) => {
                const ffmpegCmd = process.platform === 'win32'
                    ? `ffmpeg -y -threads 2 -i "${filePath}" -c:v libx264 -preset ultrafast -crf 32 -pix_fmt yuv420p -c:a copy "${fixedFilePath}"`
                    : `ffmpeg -y -threads 2 -i "${filePath}" -c:v libx264 -preset ultrafast -crf 32 -pix_fmt yuv420p -c:a copy "${fixedFilePath}"`;

                exec(ffmpegCmd, (err) => {
                    if (err) {
                        console.error('FFMPEG Error:', err);
                        // Jika ffmpeg gagal, tetap coba gunakan file asli sebagai fallback
                        fs.copyFileSync(filePath, fixedFilePath);
                        resolve();
                    } else {
                        resolve();
                    }
                });
            });

            // Fetch thumbnail for adReply
            let thumbBuffer = null;
            if (data.thumbnail) {
                try {
                    const res = await axios.get(data.thumbnail, { responseType: 'arraybuffer' });
                    thumbBuffer = Buffer.from(res.data);
                } catch (e) {
                    console.error('Failed to fetch thumbnail:', e.message);
                }
            }

            const caption = `Ini videonya buat Kakak~! @${msgData.senderJid.split('@')[0]} (๑>ᴗ<๑)\n\n` +
                `🎥 *Title:* ${data.title}\n` +
                `👤 *Author:* ${data.author}\n` +
                `⏳ *Duration:* ${data.lengthSeconds}\n` +
                `📺 *Quality:* ${resolution}\n` +
                `👀 *Views:* ${data.views}\n` +
                `📅 *Uploaded:* ${data.uploadDate}\n\n` +
                `Ryzumi sudah perbaiki videonya agar lancar diputar di WA Kakak~ ✨`;

            await sock.sendMessage(msgData.remoteJid, {
                video: { url: fixedFilePath },
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`,
                caption: caption,
                mentions: [msgData.senderJid],
                contextInfo: {
                    externalAdReply: {
                        title: data.title,
                        body: 'Ryzumi YouTube Downloader',
                        mediaType: 2,
                        sourceUrl: data.videoUrl,
                        thumbnail: thumbBuffer
                    }
                }
            }, { quoted: m });

            // Cleanup files
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(fixedFilePath)) fs.unlinkSync(fixedFilePath);

            await msgData.react('✅');

        } catch (error) {
            console.error('YTMP4 Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Uwaaa gawat! Ryzumi gagal unduh videonya: ${errMsg}.. (╥﹏╥)`);
        }
    }
};
