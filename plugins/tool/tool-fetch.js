import fetch from 'node-fetch';
import { format } from 'util';
import path from 'path';

export default {
    command: ['fetch', 'get'],
    category: 'tool',
    isRegistered: true,
    limit: 1,
    description: 'Mengambil konten atau file dari sebuah URL (URL Fetcher).',
    async execute(sock, m, msgData) {
        let text = msgData.args[0];
        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: 'Uwaaa! URL-nya mana kak? Kasih tahu Ryzumi link yang mau diambil yaa~ (˶˃ ᵕ ˂˶)'
            }, { quoted: m });
        }

        // ngecek dulu nih si user make https:// atau http:// atau gada keduanya
        if (!/^https?:\/\//.test(text)) {
            // tambah http:// sebagai default jika user lupa
            text = 'http://' + text;
        } else if (/^https:\/\//.test(text)) {
            // jika gada https:// langsung tambahin
            text = text;
        }

        m.chat = msgData.remoteJid;
        m.reply = async (txt) => sock.sendMessage(msgData.remoteJid, { text: txt }, { quoted: m });

        let _url;
        try {
            _url = new URL(text);
        } catch (e) {
            return m.reply('URL tidak valid kak!');
        }

        let url = global.API ? global.API(_url.origin, _url.pathname, Object.fromEntries(_url.searchParams.entries()), 'APIKEY') : text;

        // mengkonfigurasi seberapa banyak melakukan redirect, misal url di short sebanyak 1000 maka melakukan redirect 1000 kali (optional: 999999)
        let maxRedirects = 999999;
        let redirectCount = 0;
        let redirectUrl = url;
        let contentType = '';

        const conn = {
            sendFile: async (jid, pathOrBuffer, filename, caption, quoted) => {
                if (Buffer.isBuffer(pathOrBuffer)) {
                    let mimetype = 'application/octet-stream';
                    if (filename.endsWith('.txt')) mimetype = 'text/plain';
                    else if (filename.endsWith('.json')) mimetype = 'application/json';
                    else if (filename.endsWith('.html')) mimetype = 'text/html';
                    else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) mimetype = 'image/jpeg';
                    else if (/\.(mp4|m4v|mov|avi|flv|webm|gifv)$/i.test(filename)) mimetype = 'video/mp4';
                    else if (/\.(mp3|wav|ogg|m4a|opus|flac)$/i.test(filename)) mimetype = 'audio/mpeg';

                    if (/^image\//.test(mimetype)) {
                        return sock.sendMessage(jid, { image: pathOrBuffer, caption: caption || undefined }, { quoted });
                    }
                    if (/^video\//.test(mimetype)) {
                        return sock.sendMessage(jid, { video: pathOrBuffer, caption: caption || undefined }, { quoted });
                    }
                    if (/^audio\//.test(mimetype)) {
                        return sock.sendMessage(jid, { audio: pathOrBuffer, mimetype, caption: caption || undefined }, { quoted });
                    }

                    return sock.sendMessage(jid, {
                        document: pathOrBuffer,
                        mimetype: mimetype,
                        fileName: filename,
                        caption: caption || undefined
                    }, { quoted });
                }

                if (typeof pathOrBuffer === 'string') {
                    const isImage = /^image\//.test(contentType) || /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
                    if (isImage) {
                        return sock.sendMessage(jid, {
                            image: { url: pathOrBuffer },
                            caption: caption || undefined
                        }, { quoted });
                    }

                    const isVideo = /^video\//.test(contentType) || /\.(mp4|m4v|mov|avi|flv|webm|gifv)$/i.test(filename);
                    if (isVideo) {
                        return sock.sendMessage(jid, {
                            video: { url: pathOrBuffer },
                            caption: caption || undefined
                        }, { quoted });
                    }

                    const isAudio = /^audio\//.test(contentType) || /\.(mp3|wav|ogg|m4a|opus|flac)$/i.test(filename);
                    if (isAudio) {
                        return sock.sendMessage(jid, {
                            audio: { url: pathOrBuffer },
                            mimetype: contentType || 'audio/mp4',
                            caption: caption || undefined
                        }, { quoted });
                    }

                    return sock.sendMessage(jid, {
                        document: { url: pathOrBuffer },
                        mimetype: contentType || 'application/octet-stream',
                        fileName: filename,
                        caption: caption || undefined
                    }, { quoted });
                }
            }
        };

        try {
            while (redirectCount < maxRedirects) {
                let res = await fetch(redirectUrl);

                if (res.headers.get('content-length') > 100 * 1024 * 1024 * 1024) {
                    // menghapus respons server
                    res.body.destroy();
                    throw `Content-Length: ${res.headers.get('content-length')}`;
                }

                contentType = res.headers.get('content-type') || '';

                // ekstrak nama dari url yang gunanya buat ekstensi
                let filename = path.basename(new URL(redirectUrl).pathname) || 'file';

                // ngendaliin konten tipe yang bisa aja berbeda
                if (/^image\//.test(contentType)) {
                    await conn.sendFile(m.chat, redirectUrl, filename, text, m);
                } else if (/^text\//.test(contentType)) {
                    let txt = await res.text();
                    await m.reply(txt.slice(0, 65536) + '');
                    await conn.sendFile(m.chat, Buffer.from(txt), 'file.txt', null, m);
                } else if (/^application\/json/.test(contentType)) {
                    let txt = await res.json();
                    txt = format(JSON.stringify(txt, null, 2));
                    await m.reply(txt.slice(0, 65536) + '');
                    await conn.sendFile(m.chat, Buffer.from(txt), 'file.json', null, m);
                } else if (/^text\/html/.test(contentType)) {
                    let html = await res.text();
                    await conn.sendFile(m.chat, Buffer.from(html), 'file.html', null, m);
                } else {
                    // mengirim file sesuai ekstensi
                    await conn.sendFile(m.chat, redirectUrl, filename, text, m);
                }

                // melakukan pengeceka dulu cuy kalo ada redirect
                if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
                    let location = res.headers.get('location');
                    if (location) {
                        redirectUrl = location;
                        redirectCount++;
                    } else {
                        // ga nemu location header ? berhenti redirect
                        break;
                    }
                } else {
                    // No redirect ? berhenti redirect
                    break;
                }
            }

            if (redirectCount >= maxRedirects) {
                throw `Too many redirects (max: ${maxRedirects})`;
            }
        } catch (error) {
            console.error('Fetch Tool Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal ambil datanya kak: ${error.message || error}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
