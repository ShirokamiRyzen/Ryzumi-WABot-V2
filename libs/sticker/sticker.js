import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import webpmux from 'node-webpmux';

const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const MAX_ANIMATED_WEBP_BYTES = 950 * 1024;
const VIDEO_WEBP_PRESETS = [
    { fps: 15, size: 512, quality: 50 },
    { fps: 12, size: 384, quality: 35 },
    { fps: 10, size: 320, quality: 25 },
    { fps: 8, size: 256, quality: 18 },
    { fps: 6, size: 224, quality: 12 }
];

function safeUnlink(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch {}
    }
}

/**
 * Image to WebP
 */
async function imageToWebp(media) {
    const tmpFileIn = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
    const tmpFileOut = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        fs.writeFileSync(tmpFileIn, media);

        await new Promise((resolve, reject) => {
            ffmpeg(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                    '-q:v', '80',
                    '-compression_level', '6'
                ])
                .toFormat('webp')
                .save(tmpFileOut);
        });

        return fs.readFileSync(tmpFileOut);
    } finally {
        safeUnlink(tmpFileIn);
        safeUnlink(tmpFileOut);
    }
}

/**
 * Video to WebP with adaptive compression to stay under WhatsApp's ~1 MB animated sticker limit
 */
async function videoToWebp(media, maxBytes = MAX_ANIMATED_WEBP_BYTES) {
    const tmpFileIn = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    const tmpFileOut = path.join(tmpDir, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    try {
        fs.writeFileSync(tmpFileIn, media);

        let buff = null;
        for (const preset of VIDEO_WEBP_PRESETS) {
            await new Promise((resolve, reject) => {
                ffmpeg(tmpFileIn)
                    .on('error', reject)
                    .on('end', () => resolve(true))
                    .addOutputOptions([
                        '-vcodec', 'libwebp',
                        '-vf', `fps=${preset.fps},scale=${preset.size}:${preset.size}:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=${preset.size}:${preset.size}:(ow-iw)/2:(oh-ih)/2:color=#00000000`,
                        '-loop', '0',
                        '-ss', '00:00:00',
                        '-t', '00:00:10',
                        '-preset', 'default',
                        '-q:v', String(preset.quality),
                        '-compression_level', '4',
                        '-an'
                    ])
                    .toFormat('webp')
                    .save(tmpFileOut);
            });

            buff = fs.readFileSync(tmpFileOut);
            if (buff.length <= maxBytes) break;
        }

        return buff;
    } finally {
        safeUnlink(tmpFileIn);
        safeUnlink(tmpFileOut);
    }
}

/**
 * Format sticker author watermark: Name (+WhatsApp Number)
 */
function formatStickerAuthor(user, msgData) {
    const jid = (user?.jid?.endsWith('@s.whatsapp.net') ? user.jid : '') ||
                (msgData?.senderJid?.endsWith('@s.whatsapp.net') ? msgData.senderJid : '') ||
                user?.jid || msgData?.senderJid || '';
    const rawNumber = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    const userNumber = rawNumber ? `+${rawNumber}` : '';

    let userName = (user?.name || msgData?.pushName || '').trim();
    if (!userName || (rawNumber && userName.replace(/[^0-9]/g, '') === rawNumber)) {
        userName = 'User';
    }

    return userNumber ? `${userName} (${userNumber})` : userName;
}

/**
 * Create EXIF metadata and write to WebP
 */
async function writeExif(media, metadata) {
    const img = new webpmux.Image();
    await img.load(media);
    
    let packname = metadata?.packName || 'Ryzumi Bot';
    let author = metadata?.packPublish || (metadata?.user || metadata?.msgData ? formatStickerAuthor(metadata.user, metadata.msgData) : 'User');

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

export { imageToWebp, videoToWebp, writeExif, formatStickerAuthor };
