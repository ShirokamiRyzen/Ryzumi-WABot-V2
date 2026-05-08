import axios from 'axios';
import sharp from 'sharp';
import pkg from 'baileys';
const { generateWAMessageContent, generateWAMessageFromContent, proto } = pkg;
import config from '../../config.js';

export default {
    command: ['pixiv', 'pixivdl'],
    category: 'downloader',
    isRegistered: true,
    limit: 1,
    description: 'Mengunduh gambar dari link Pixiv',
    async execute(sock, m, msgData) {
        const link = msgData.args[0];

        if (!link || !link.includes('pixiv.net')) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kasih Ryzumi link Pixiv-nya dong kak buat di-download~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} https://www.pixiv.net/en/artworks/92445569\``
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/search/pixiv?query=${encodeURIComponent(link)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!data || !data.Media || !Array.isArray(data.Media) || data.Media.length < 1) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, link Pixiv-nya nggak valid atau datanya nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            const images = data.Media;
            const caption = data.caption || 'Pixiv Downloader Result';
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

            // Jika cuma ada satu gambar, kirim biasa aja biar cepet~ (˶˃ ᵕ ˂˶)
            if (images.length === 1) {
                const response = await axios.get(images[0], { responseType: 'arraybuffer' });
                await sock.sendMessage(msgData.remoteJid, {
                    image: Buffer.from(response.data),
                    caption: `*Pixiv Downloader*\n\n*Artist:* ${artist}\n*Tags:* ${tags}\n\n${caption}`
                }, { quoted: m });
            } else {
                // Kalau banyak, pakai carousel biar rapi kak! (๑>ᴗ<๑)
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
                                        url: link
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
                                    text: `Horeee! Ini gambar dari link Pixiv kakak~ (˶˃ ᵕ ˂˶)\nTotal: ${images.length} halaman.`
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: `Ryzumi-WABot V2 • Pixiv Downloader`
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
            }

            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Pixiv Downloader Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal download gambarnya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};

