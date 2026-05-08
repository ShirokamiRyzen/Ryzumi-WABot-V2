import axios from 'axios';
import pkg from 'baileys';
const { generateWAMessageContent, generateWAMessageFromContent, proto } = pkg;
import config from '../../config.js';

export default {
    command: ['pinsearch', 'pinterestsearch', 'pins'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari gambar di Pinterest',
    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ');

        if (!query) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kakak mau cari gambar apa di Pinterest? Kasih tahu Ryzumi yaa~ (˶˃ ᵕ ˂˶)\n\nContoh: \`.${msgData.commandName} Nao Tomori\``
            }, { quoted: m });
        }

        // Kalau isinya link, arahin ke downloader aja kak~ (๑>ᴗ<๑)
        if (query.includes('pinterest.com') || query.includes('pin.it')) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Kalau kakak punya link Pinterest-nya, pakai perintah \`.pin\` aja yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: { text: '🕓', key: m.key }
        });

        try {
            const url = `${config.API_RYZUMI}/api/search/pinterest?query=${encodeURIComponent(query)}`;
            const res = await axios.get(url);
            const data = res.data;

            if (!Array.isArray(data) || data.length < 1) {
                return sock.sendMessage(msgData.remoteJid, {
                    text: `Maafin Ryzumi kak, gambar Pinterest yang kakak cari nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            // Acak dan ambil maksimal 5 hasil aja biar nggak berat~ (˶˃ ᵕ ˂˶)
            const results = data.sort(() => Math.random() - 0.5).slice(0, Math.min(5, data.length));
            const push = [];

            const createImage = async (imgUrl) => {
                const response = await axios.get(imgUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                        'Referer': imgUrl
                    }
                });

                const { imageMessage } = await generateWAMessageContent({
                    image: Buffer.from(response.data)
                }, {
                    upload: sock.waUploadToServer
                });
                return imageMessage;
            };

            for (const result of results) {
                try {
                    const imageMsg = await createImage(result.directLink);
                    push.push({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `Pencarian: ${query}`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: `Ryzumi-WABot V2 • Pinterest`
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
                                        display_text: "View on Pinterest",
                                        cta_type: "1",
                                        url: result.link
                                    })
                                }
                            ]
                        })
                    });
                } catch (err) {
                    console.error('Failed to process one Pinterest image:', err.message);
                }
            }

            if (push.length === 0) {
                throw new Error('Gagal memproses semua gambar Pinterest.. (╥﹏╥)');
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
                                text: `Horeee! Ini hasil pencarian Pinterest buat kakak~ (˶˃ ᵕ ˂˶)\nKetemu ${push.length} gambar.`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `Ryzumi-WABot V2 • Pinterest Search`
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
            console.error('Pinterest Search Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal cari gambar Pinterest-nya kak.. (╥﹏╥)\n\n*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};
