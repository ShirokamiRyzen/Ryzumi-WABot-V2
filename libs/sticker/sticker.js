import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import webpmux from 'node-webpmux';

const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

/**
 * Image to WebP
 */
async function imageToWebp(media) {
    const tmpFileIn = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
    const tmpFileOut = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ffmpeg(tmpFileIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'
            ])
            .toFormat('webp')
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    fs.unlinkSync(tmpFileOut);
    return buff;
}

/**
 * Video to WebP
 */
async function videoToWebp(media) {
    const tmpFileIn = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    const tmpFileOut = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ffmpeg(tmpFileIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                '-loop', '0',
                '-ss', '00:00:00',
                '-t', '00:00:10',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    fs.unlinkSync(tmpFileOut);
    return buff;
}

/**
 * Create EXIF metadata and write to WebP
 */
async function writeExif(media, metadata) {
    const img = new webpmux.Image();
    await img.load(media);
    
    let packname = metadata?.packName || '';
    let author = metadata?.packPublish || '';

    const json = {
        'sticker-pack-id': 'Ryzumi-WABot-V2',
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'emojis': ['😊']
    };

    let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    let exif = Buffer.concat([exifAttr, jsonBuffer]);
    
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exif;

    return await img.save(null);
}

export { imageToWebp, videoToWebp, writeExif };
