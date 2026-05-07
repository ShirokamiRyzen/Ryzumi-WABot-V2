// Don't delete this credit!!!
// Script by ShirokamiRyzen

import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import config from '../../config.js';

export default {
    command: ['instagram', 'ig', 'igdl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh video, gambar, atau audio dari Instagram.',
    async execute(sock, m, msgData) {
        if (msgData.args.length === 0) {
            return sock.sendMessage(msgData.remoteJid, { text: `Kakak lupa masukin link Instagram-nya yaa? Pakainya gini: .${msgData.commandName} <url> kakak~ (˶˃ ᵕ ˂˶)` }, { quoted: m });
        }

        const url = msgData.args[0];
        const withAudio = msgData.messageContent.includes('--with-audio'); // Mendukung flag --with-audio

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        try {
            const { data } = await axios.get(`${config.API_RYZUMI}/api/downloader/instagram?url=${encodeURIComponent(url)}`);

            if (!data.success || !data.result) {
                throw new Error('Yahhh, media Instagram-nya nggak ketemu atau link-nya bermasalah kak~ (╥﹏╥)');
            }

            const result = data.result;
            const media = result.media;

            let allMedia = [...(media.videos || []), ...(media.images || [])];
            if (withAudio) {
                allMedia = [...allMedia, ...(media.audio || [])];
            }

            if (allMedia.length === 0) {
                throw new Error('Waaa, nggak ada media yang bisa aku ambil dari sini uwooo~ (｡T ω T｡)');
            }

            let first = true;
            for (const item of allMedia) {
                const caption = (first && item.type !== 'audio') ? (result.title || `Ini dia pesanan kakak @${msgData.senderJid.split('@')[0]}~ Spesial buat kakak! (๑>ᴗ<๑)`) : '';
                const mediaUrl = item.url;

                try {
                    const videoIndex = media.videos ? media.videos.findIndex(v => v.url === item.url) : -1;
                    const hasMatchingAudio = videoIndex !== -1 && media.audio && media.audio.length > videoIndex;

                    // Logika penggabungan audio jika video tidak memiliki suara bawaan (untuk beberapa jenis post IG)
                    if (item.type === 'video' && item.isAudio === false && hasMatchingAudio) {
                        const videoUrl = item.url;
                        const audioUrl = media.audio[videoIndex].url;

                        const headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                        };

                        const [vidRes, audRes] = await Promise.all([
                            axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 30000, headers }),
                            axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000, headers })
                        ]);

                        const randStr = Math.random().toString(36).substring(7);
                        const tmpVid = path.join(os.tmpdir(), `vid_${Date.now()}_${randStr}.mp4`);
                        const tmpAud = path.join(os.tmpdir(), `aud_${Date.now()}_${randStr}.m4a`);
                        const tmpOut = path.join(os.tmpdir(), `out_${Date.now()}_${randStr}.mp4`);

                        try {
                            fs.writeFileSync(tmpVid, Buffer.from(vidRes.data));
                            fs.writeFileSync(tmpAud, Buffer.from(audRes.data));

                            await new Promise((resolve, reject) => {
                                exec(`ffmpeg -i "${tmpVid}" -i "${tmpAud}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${tmpOut}"`, (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            });

                            const mergedBuffer = fs.readFileSync(tmpOut);
                            await sock.sendMessage(msgData.remoteJid, {
                                video: mergedBuffer,
                                mimetype: "video/mp4",
                                fileName: `video.mp4`,
                                caption: caption,
                                mentions: [msgData.senderJid],
                            }, { quoted: m });
                        } finally {
                            if (fs.existsSync(tmpVid)) fs.unlinkSync(tmpVid);
                            if (fs.existsSync(tmpAud)) fs.unlinkSync(tmpAud);
                            if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
                        }
                    } else {
                        // Download langsung jika tidak butuh merge
                        const res = await axios.get(mediaUrl, {
                            responseType: 'arraybuffer',
                            timeout: 30000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                            }
                        });
                        const buffer = Buffer.from(res.data);

                        if (item.type === 'video') {
                            await sock.sendMessage(msgData.remoteJid, {
                                video: buffer,
                                mimetype: "video/mp4",
                                fileName: `video.mp4`,
                                caption: caption,
                                mentions: [msgData.senderJid],
                            }, { quoted: m });
                        } else if (item.type === 'image') {
                            await sock.sendMessage(msgData.remoteJid, {
                                image: buffer,
                                caption: caption,
                                mentions: [msgData.senderJid],
                            }, { quoted: m });
                        } else if (item.type === 'audio') {
                            await sock.sendMessage(msgData.remoteJid, {
                                audio: buffer,
                                mimetype: item.mimetype || "audio/mpeg",
                                fileName: `audio.mp3`,
                            }, { quoted: m });
                        }
                    }
                } catch (e) {
                    console.error('Error sending media item:', e);
                }

                if (item.type !== 'audio') first = false;
            }

            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Instagram Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            const errMsg = error.response?.data?.message || error.message;
            await sock.sendMessage(msgData.remoteJid, { text: `Gomenasai kak! Ada error: ${errMsg}.. Coba cek lagi yaa~ (⊙_⊙)` }, { quoted: m });
        }
    }
};
