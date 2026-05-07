import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Mengonversi WebP (biasanya stiker animasi) menjadi MP4 menggunakan EZGIF.
 * @param {Buffer|String} source - Buffer media atau URL gambar.
 * @returns {Promise<String|Null>} - URL hasil konversi atau null jika gagal.
 */
async function webp2mp4(source) {
    try {
        const form = new FormData();
        const isUrl = typeof source === 'string' && /https?:\/\//.test(source);
        
        if (isUrl) {
            form.append('new-image-url', source);
        } else {
            const blob = new Blob([source], { type: 'image/webp' });
            form.append('new-image', blob, 'image.webp');
        }

        // Tahap 1: Upload ke EZGIF
        const res = await axios.post('https://ezgif.com/webp-to-mp4', form);
        const html = res.data;
        const { document } = new JSDOM(html).window;
        
        const form2 = new FormData();
        const inputs = document.querySelectorAll('form input[name]');
        if (inputs.length === 0) return null;

        let fileValue = '';
        for (const input of inputs) {
            form2.append(input.name, input.value);
            if (input.name === 'file') fileValue = input.value;
        }

        // Tahap 2: Proses konversi
        const res2 = await axios.post('https://ezgif.com/webp-to-mp4/' + fileValue, form2);
        const html2 = res2.data;
        const { document: document2 } = new JSDOM(html2).window;
        
        const videoUrl = document2.querySelector('div#output > p.outfile > video > source')?.src;
        if (!videoUrl) return null;
        
        return new URL(videoUrl, 'https://ezgif.com').toString();
    } catch (error) {
        console.error('webp2mp4 error:', error);
        return null;
    }
}

/**
 * Mengonversi WebP menjadi PNG menggunakan EZGIF.
 * @param {Buffer|String} source - Buffer media atau URL gambar.
 * @returns {Promise<String|Null>} - URL hasil konversi atau null jika gagal.
 */
async function webp2png(source) {
    try {
        const form = new FormData();
        const isUrl = typeof source === 'string' && /https?:\/\//.test(source);
        
        if (isUrl) {
            form.append('new-image-url', source);
        } else {
            const blob = new Blob([source], { type: 'image/webp' });
            form.append('new-image', blob, 'image.webp');
        }

        const res = await axios.post('https://ezgif.com/webp-to-png', form);
        const html = res.data;
        const { document } = new JSDOM(html).window;
        
        const form2 = new FormData();
        const inputs = document.querySelectorAll('form input[name]');
        if (inputs.length === 0) return null;

        let fileValue = '';
        for (const input of inputs) {
            form2.append(input.name, input.value);
            if (input.name === 'file') fileValue = input.value;
        }

        const res2 = await axios.post('https://ezgif.com/webp-to-png/' + fileValue, form2);
        const html2 = res2.data;
        const { document: document2 } = new JSDOM(html2).window;
        
        const imgUrl = document2.querySelector('div#output > p.outfile > img')?.src;
        if (!imgUrl) return null;
        
        return new URL(imgUrl, 'https://ezgif.com').toString();
    } catch (error) {
        console.error('webp2png error:', error);
        return null;
    }
}

export { webp2mp4, webp2png };
