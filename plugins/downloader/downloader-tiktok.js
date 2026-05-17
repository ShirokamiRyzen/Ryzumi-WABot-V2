import axios from 'axios';

export default {
    command: ['tiktok', 'ttdl', 'douyin', 'tt', 'tiktokdl'],
    category: 'downloader',
    isRegistered: true,
    limit: true,
    description: 'Mengunduh video atau gambar dari TikTok/Douyin.',
    async execute(sock, m, msgData) {
        const { config, args, commandName, remoteJid } = msgData;

        if (args.length === 0) {
            return msgData.reply(`Kakak lupa kasih link TikTok-nya yaa? Contohnya gini: .${commandName} https://www.tiktok.com/@... (˶˃ ᵕ ˂˶)`);
        }

        await msgData.react('⏳');

        try {
            const url = args[0];
            const isDouyin = url.includes("douyin");
            const apiEndpoint = isDouyin
                ? `${config.API_RYZUMI}/api/downloader/douyin?url=${url}`
                : `${config.API_RYZUMI}/api/downloader/tiktok?url=${url}`;

            const { data: response } = await axios.get(apiEndpoint);
            let videoData, videoURL, info;

            if (isDouyin) {
                if (!response.success || !response.data) throw new Error("Gagal mendownload video Douyin kak~ (╥﹏╥)");
                videoData = response.data;
                const videoInfo = videoData.video_data;
                const hdURL = videoInfo.nwm_video_url_HQ;
                videoURL = (args[1] === "hd" && hdURL) ? hdURL : videoInfo.nwm_video_url;

                const uploadTime = new Date(videoData.create_time * 1000).toLocaleString();
                const author = videoData.author || {};
                info = `*Caption:* ${videoData.desc || '-'}\n*Upload:* ${uploadTime}\n*Uploader:* ${author.nickname || "unknown"}`;
            } else {
                videoData = response.data?.data;
                if (!videoData) throw new Error("Gagal mendownload video TikTok kak~ (╥﹏╥)");
                const hdURL = videoData.hdplay;
                videoURL = (args[1] === "hd" && hdURL) ? hdURL : videoData.play;

                const author = videoData.author || {};
                info = `*Title:* ${videoData.title || '-'}\n*Uploader:* ${author.nickname || "unknown"}\n\n*Statistik:* ✨\n❤️ ${videoData.digg_count} | 💬 ${videoData.comment_count} | 🔁 ${videoData.share_count}`;
            }

            // Jika TikTok berupa koleksi gambar (slideshow)
            if (videoData.images && videoData.images.length > 0) {
                for (let i = 0; i < videoData.images.length; i++) {
                    const caption = i === 0 ? `Ini foto TikTok-nya kak~ (๑>ᴗ<๑)\n\n${info}` : '';
                    await sock.sendMessage(remoteJid, {
                        image: { url: videoData.images[i] },
                        caption: caption
                    }, { quoted: m });
                }
            } else if (videoURL) {
                await sock.sendMessage(remoteJid, {
                    video: { url: videoURL },
                    caption: `Ini videonya buat kakak~ (˶˃ ᵕ ˂˶)\n\n${info}`,
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                throw new Error("Maafin aku kak, nggak ada video atau gambar yang bisa aku ambil.. (╥﹏╥)");
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('TikTok Downloader Error:', error);
            await msgData.react('❌');
            const errMsg = error.response?.data?.message || error.message;
            await msgData.reply(`Uwaaa gawat! Ada error pas download TikTok: ${errMsg}.. (｡T ω T｡)`);
        }
    }
};
