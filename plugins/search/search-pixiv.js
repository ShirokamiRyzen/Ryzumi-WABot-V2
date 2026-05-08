import axios from 'axios';
import sharp from 'sharp';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageContent, generateWAMessageFromContent, proto } = pkg;
import config from '../../config.js';

export default {
    command: ['pixivsearch', 'pixivs'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari gambar di Pixiv',
    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ');

        if (!query) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari gambar apa di Pixiv? Kasih tahu Ryzumi yaa~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} Nao Tomori\``
            }, { quoted: m });
        }

        if (query.includes('pixiv.net')) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kalau kakak mau download dari link, pakai perintah \`.pixiv\` aja yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/search/pixiv?query=${encodeURIComponent(query)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!data || !data.Media || !Array.isArray(data.Media) || data.Media.length < 1) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, gambar Pixiv yang kakak cari nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            const images = data.Media;
            const pageLink = `https://www.pixiv.net/search.php?s_mode=s_tag&word=${encodeURIComponent(query)}`;

            const caption = data.caption || 'Pixiv Search Result';
            const artist = data.artist || 'Unknown';
            const tags = data.tags ? data.tags.join(', ') : '-';

            const push = [];

            const createImage = async (imgUrl) => {
                const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                let buffer = Buffer.from(response.data);

                const threshold = 12 * 1024 * 1024;
                if (buffer.length > threshold) {
                    buffer = await sharp(buffer)
                        .jpeg({ quality: 80 })
                        .toBuffer();
                }

                const { imageMessage } = await generateWAMessageContent({
                    image: buffer
                }, {
                    upload: sock.waUploadToServer
                });
                return imageMessage;
            };

            for (const imageUrl of images) {
                const imageMsg = await createImage(imageUrl);
                push.push({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: caption
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: `Artist: ${artist}\nTags: ${tags}`
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        title: '',
                        hasMediaAttachment: true,
                        imageMessage: imageMsg
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "View on Pixiv",
                                    cta_type: "1",
                                    url: pageLink
                                })
                            }
                        ]
                    })
                });
            }

            const msg = generateWAMessageFromContent(msgData.remoteJid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: `Horeee! Ini hasil pencarian Pixiv buat kakak~ (˶˃ ᵕ ˂˶)\nTotal: ${images.length} gambar.`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `Ryzumi-WABot V2 • Pixiv Search`
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                hasMediaAttachment: false
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                                cards: push
                            })
                        })
                    }
                }
            }, { quoted: m });

            await sock.relayMessage(msgData.remoteJid, msg.message, {
                messageId: msg.key.id
            });

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Pixiv Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal cari gambar Pixiv-nya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
