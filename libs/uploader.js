import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import config from '../config.js';

/**
 * Upload media to Ryzumi CDN
 * @param {Buffer|Array<Buffer>} inp 
 * @returns {Promise<any>} Response from the CDN
 */
const ryzumiCDN = async (inp) => {
    try {
        const form = new FormData();
        const files = Array.isArray(inp) ? inp : [inp];

        for (const file of files) {
            const buffer = Buffer.isBuffer(file) ? file : file.buffer;
            if (!Buffer.isBuffer(buffer)) throw new Error('Format buffer tidak valid kak.. (｡T ω T｡)');

            const type = await fileTypeFromBuffer(buffer);
            if (!type) throw new Error('Tipe file tidak didukung kak.. (╥﹏╥)');

            const originalName = (file.originalname || 'ryzumi-file').split('.').shift();

            form.append('file', buffer, {
                filename: `${originalName}.${type.ext}`,
                contentType: type.mime
            });
        }

        const res = await fetch(`${config.API_RYZUMI}/api/uploader/ryzumicdn`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                ...form.getHeaders(),
            },
            body: form,
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Gagal mengunggah file ke CDN.. (╥﹏╥)');

        // Mengembalikan hasil sesuai format input (array atau single object)
        if (Array.isArray(inp)) {
            return json.result || json.url || json;
        }
        return json;

    } catch (error) {
        throw new Error(`RyzenCDN Error: ${error.message}`);
    }
};

export { ryzumiCDN };
