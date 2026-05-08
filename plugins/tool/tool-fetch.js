import fetch from 'node-fetch';
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

        // Normalisasi URL biar nggak error~
        if (!/^https?:\/\//.test(text)) text = 'https://' + text;

        try {
            // Ryzumi pakai fetch dengan opsi redirect otomatis yaa~
            const res = await fetch(text, {
                redirect: 'follow',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Cek ukuran file biar botnya nggak meledak kak! (maks 100MB)
            const contentLength = res.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
                throw new Error(`Aduuh file-nya kegedean kak! Ukurannya ${contentLength} bytes.. (｡T ω T｡)`);
            }

            const contentType = res.headers.get('content-type') || '';
            const filename = path.basename(new URL(res.url).pathname) || 'file-ryzumi';

            // 1. Jika kontennya adalah gambar
            if (/^image\//.test(contentType)) {
                await sock.sendMessage(msgData.remoteJid, {
                    image: { url: res.url },
                    caption: `Horeee~! Ini gambar yang kakak minta~! (๑>ᴗ<๑)\n\n*URL:* ${text}`
                }, { quoted: m });
            }
            // 2. Jika kontennya teks atau JSON
            else if (/^text\//.test(contentType) || /^application\/json/.test(contentType)) {
                let txt = await res.text();

                // Rapikan kalau JSON biar enak dibaca kakak~
                if (/json/.test(contentType)) {
                    try { txt = JSON.stringify(JSON.parse(txt), null, 2); } catch { }
                }

                // Kirim teks langsung kalau pendek, kalau panjang jadi file yaa!
                if (txt.length > 4000) {
                    const ext = /json/.test(contentType) ? 'json' : 'txt';
                    await sock.sendMessage(msgData.remoteJid, {
                        document: Buffer.from(txt),
                        mimetype: contentType,
                        fileName: `fetch-result.${ext}`
                    }, { quoted: m });
                    await sock.sendMessage(msgData.remoteJid, { text: `Kontennya kepanjangan kak, jadi Ryzumi kirim sebagai file yaa~ (˶˃ ᵕ ˂˶)` }, { quoted: m });
                } else {
                    await sock.sendMessage(msgData.remoteJid, { text: txt }, { quoted: m });
                }
            }
            // 3. Jika kontennya HTML
            else if (/text\/html/.test(contentType)) {
                const html = await res.text();
                await sock.sendMessage(msgData.remoteJid, {
                    document: Buffer.from(html),
                    mimetype: 'text/html',
                    fileName: 'page.html'
                }, { quoted: m });
                await sock.sendMessage(msgData.remoteJid, { text: 'Itu file HTML-nya sudah Ryzumi ambilkan kak! (๑>ᴗ<๑)' }, { quoted: m });
            }
            // 4. Lain-lain (File umum)
            else {
                await sock.sendMessage(msgData.remoteJid, {
                    document: { url: res.url },
                    mimetype: contentType || 'application/octet-stream',
                    fileName: filename
                }, { quoted: m });
            }

        } catch (error) {
            console.error('Fetch Tool Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa gawat! Ryzumi gagal ambil datanya kak: ${error.message}.. (╥﹏╥)`
            }, { quoted: m });
        }
    }
};
