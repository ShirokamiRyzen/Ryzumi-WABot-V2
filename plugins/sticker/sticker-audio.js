import fs from 'fs';
import path from 'path';
import crypto, { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { proto, prepareWAMessageMedia, downloadContentFromMessage } from 'baileys';
import { imageToWebp, videoToWebp, writeExif, formatStickerAuthor } from '../../libs/sticker/sticker.js';

const execFileAsync = promisify(execFile);
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function patchBaileysAudioStickerProto() {
    const Msg = proto?.Message;
    const StickerMsg = Msg?.StickerMessage;
    const AudioMsg = Msg?.AudioMessage;
    const FutureProofMsg = Msg?.FutureProofMessage;

    if (!Msg || !StickerMsg || !AudioMsg || !FutureProofMsg) {
        throw new Error('Struktur proto Baileys tidak ditemukan.');
    }

    if (Msg.__audioStickerPatched) return;

    if (!StickerMsg.encode.toString().includes('audioMessage')) {
        const origStickerEncode = StickerMsg.encode.bind(StickerMsg);
        StickerMsg.encode = function encode(message, writer) {
            writer = origStickerEncode(message, writer);
            if (message?.audioMessage != null) {
                AudioMsg.encode(
                    message.audioMessage,
                    writer.uint32(210).fork()
                ).ldelim();
            }
            return writer;
        };

        const origStickerFromObject = StickerMsg.fromObject.bind(StickerMsg);
        StickerMsg.fromObject = function fromObject(object) {
            const msg = origStickerFromObject(object);
            if (object?.audioMessage != null) {
                msg.audioMessage = AudioMsg.fromObject(object.audioMessage);
            }
            return msg;
        };
    }

    if (!Msg.encode.toString().includes('audioStickerMessage')) {
        const origMsgEncode = Msg.encode.bind(Msg);
        Msg.encode = function encode(message, writer) {
            writer = origMsgEncode(message, writer);
            if (message?.audioStickerMessage != null) {
                FutureProofMsg.encode(
                    message.audioStickerMessage,
                    writer.uint32(1074).fork()
                ).ldelim();
            }
            return writer;
        };

        const origMsgFromObject = Msg.fromObject.bind(Msg);
        Msg.fromObject = function fromObject(object) {
            const msg = origMsgFromObject(object);
            if (object?.audioStickerMessage != null) {
                msg.audioStickerMessage = FutureProofMsg.fromObject(
                    object.audioStickerMessage
                );
            }
            return msg;
        };
    }

    Msg.__audioStickerPatched = true;
}

function isWebP(buffer) {
    return buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP';
}

function isAnimatedWebP(buffer) {
    if (!isWebP(buffer)) return false;

    let offset = 12;
    while (offset < buffer.length - 8) {
        const chunk = buffer.toString('ascii', offset, offset + 4);
        const size = buffer.readUInt32LE(offset + 4);

        if (chunk === 'VP8X' && (buffer[offset + 8] & 0x02)) return true;
        if (chunk === 'ANIM' || chunk === 'ANMF') return true;

        offset += 8 + size + (size % 2);
    }
    return false;
}

async function downloadMessageBuffer(targetMsg, targetType) {
    if (!targetMsg || !targetType) return null;
    const mediaType = targetType.replace('Message', '');
    const stream = await downloadContentFromMessage(
        targetMsg[targetType] || targetMsg,
        mediaType === 'sticker' ? 'image' : mediaType
    );

    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function visualToStickerBuffer(buffer, mime, type, exifData) {
    if ((/webp|sticker/i.test(mime) || type === 'stickerMessage') && isWebP(buffer)) {
        return await writeExif(buffer, exifData);
    }

    const isVideoLike = /video|gif/i.test(mime) || type === 'videoMessage';
    const webpBuffer = isVideoLike ? await videoToWebp(buffer) : await imageToWebp(buffer);
    return await writeExif(webpBuffer, exifData);
}

async function generateWaveform(oggPath) {
    try {
        const { stdout } = await execFileAsync(
            'ffmpeg',
            [
                '-v', 'error',
                '-i', oggPath,
                '-ac', '1',
                '-ar', '8000',
                '-f', 's16le',
                'pipe:1'
            ],
            { encoding: 'buffer', maxBuffer: 5 * 1024 * 1024 }
        );

        const totalSamples = Math.floor(stdout.length / 2);
        const bars = 64;
        if (totalSamples < bars) return Buffer.alloc(bars, 10);

        const blockSize = Math.floor(totalSamples / bars);
        const raw = [];
        let maxVal = 0;

        for (let i = 0; i < bars; i++) {
            let sum = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize; j++) {
                const sample = Math.abs(stdout.readInt16LE((start + j) * 2));
                sum += sample;
            }
            const avg = sum / blockSize;
            if (avg > maxVal) maxVal = avg;
            raw.push(avg);
        }

        const multiplier = maxVal > 0 ? 100 / maxVal : 1;
        return Buffer.from(raw.map(v => Math.min(100, Math.floor(v * multiplier))));
    } catch {
        return Buffer.alloc(64, 15);
    }
}

async function toOggOpus(buffer, tempFiles) {
    const inputFile = path.join(tmpDir, `${randomUUID()}.bin`);
    const outputFile = path.join(tmpDir, `${randomUUID()}.ogg`);
    fs.writeFileSync(inputFile, buffer);
    tempFiles.push(inputFile, outputFile);

    try {
        await execFileAsync('ffmpeg', [
            '-y',
            '-loglevel', 'error',
            '-err_detect', 'ignore_err',
            '-fflags', '+discardcorrupt',
            '-i', inputFile,
            '-vn',
            '-t', '25',
            '-ar', '16000',
            '-ac', '1',
            '-c:a', 'libopus',
            '-b:a', '32k',
            '-vbr', 'on',
            '-compression_level', '10',
            '-frame_duration', '20',
            '-application', 'voip',
            '-avoid_negative_ts', 'make_zero',
            '-map_metadata', '-1',
            '-f', 'ogg',
            outputFile
        ]);
    } catch (err) {
        const stderr = err.stderr || err.message || '';
        if (/does not contain any stream|Output file #0 does not contain/i.test(stderr)) {
            throw new Error('NO_AUDIO_STREAM');
        }
        throw err;
    }

    let seconds = 1;
    try {
        const { stdout } = await execFileAsync('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            outputFile
        ]);
        const parsed = Math.ceil(parseFloat(stdout.trim()));
        if (!Number.isNaN(parsed) && parsed > 0) {
            seconds = Math.min(parsed, 25);
        }
    } catch {
        seconds = 5;
    }

    const waveform = await generateWaveform(outputFile);

    return {
        buffer: fs.readFileSync(outputFile),
        seconds,
        waveform
    };
}

async function sendAudioSticker(sock, remoteJid, m, stickerBuffer, oggResult) {
    patchBaileysAudioStickerProto();

    const meta = await sharp(stickerBuffer).metadata().catch(() => ({}));
    const width = meta.width || 512;
    const height = meta.height || 512;

    const [stickerMedia, audioMedia] = await Promise.all([
        prepareWAMessageMedia(
            { sticker: stickerBuffer },
            { upload: sock.waUploadToServer }
        ),
        prepareWAMessageMedia(
            {
                audio: oggResult.buffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            },
            { upload: sock.waUploadToServer }
        )
    ]);

    const stickerMessage = stickerMedia.stickerMessage;
    const audioMessage = audioMedia.audioMessage;

    if (!stickerMessage || !audioMessage) {
        throw new Error('Gagal menyiapkan media stiker atau audio.');
    }

    audioMessage.mimetype = 'audio/ogg; codecs=opus';
    audioMessage.ptt = true;
    audioMessage.seconds = oggResult.seconds;
    if (!audioMessage.waveform || !audioMessage.waveform.length) {
        audioMessage.waveform = oggResult.waveform;
    }

    stickerMessage.width = width;
    stickerMessage.height = height;
    stickerMessage.isAnimated = isAnimatedWebP(stickerBuffer);
    stickerMessage.isLottie = false;
    stickerMessage.audioMessage = audioMessage;

    const payload = {
        messageContextInfo: {
            messageSecret: crypto.randomBytes(32)
        },
        audioStickerMessage: {
            message: {
                stickerMessage
            }
        }
    };

    await sock.relayMessage(remoteJid, payload, { quoted: m });
}

export default {
    command: ['sa', 'stickeraudio', 'saudio', 'stikeraudio'],
    category: 'sticker',
    isRegistered: true,
    description: 'Membuat stiker WhatsApp bersuara (audio sticker) dari video bersuara atau gabungan gambar/stiker/video dengan audio/VN.',
    async execute(sock, m, msgData, user) {
        const {
            config,
            remoteJid,
            isQuoted,
            messageType,
            quotedType,
            mime,
            quotedMime,
            msg,
            quotedMsg,
            messageContent,
            commandName
        } = msgData;

        const tempFiles = [];

        try {
            const isVisual = (mediaMime, type) =>
                /image|video|webp|sticker/i.test(mediaMime) ||
                /imageMessage|videoMessage|stickerMessage/.test(type);
            const isAudio = (mediaMime, type) =>
                /audio/i.test(mediaMime) || type === 'audioMessage';
            const isVideo = (mediaMime, type) =>
                /video/i.test(mediaMime) || type === 'videoMessage';

            let visualTarget = null;
            let audioTarget = null;

            if (isVisual(mime, messageType) && isQuoted && isAudio(quotedMime, quotedType)) {
                visualTarget = { msg, type: messageType, mime };
                audioTarget = { msg: quotedMsg, type: quotedType, mime: quotedMime };
            } else if (isAudio(mime, messageType) && isQuoted && isVisual(quotedMime, quotedType)) {
                visualTarget = { msg: quotedMsg, type: quotedType, mime: quotedMime };
                audioTarget = { msg, type: messageType, mime };
            } else if (isQuoted && isVideo(quotedMime, quotedType)) {
                visualTarget = { msg: quotedMsg, type: quotedType, mime: quotedMime };
                audioTarget = visualTarget;
            } else if (isVideo(mime, messageType)) {
                visualTarget = { msg, type: messageType, mime };
                audioTarget = visualTarget;
            } else {
                const prefix = messageContent?.[0] || '.';
                const cmd = commandName || 'sa';
                return msgData.reply(
                    `Cara pakai *${prefix + cmd}* gampang banget kak~ (˶˃ ᵕ ˂˶) .ᐟ.ᐟ\n\n` +
                    `1. Kirim atau balas *video* bersuara (otomatis jadi stiker + audionya)\n` +
                    `2. Balas *audio/VN* sambil kirim *foto/video* dengan caption *${prefix + cmd}*\n` +
                    `3. Balas *foto/stiker/video* sambil kirim *audio/VN* dengan caption *${prefix + cmd}*`
                );
            }

            await msgData.react('⏳');

            const exifData = {
                packName: config.BOT_NAME || 'Ryzumi Bot',
                packPublish: formatStickerAuthor(user, msgData)
            };

            const visualBuffer = await downloadMessageBuffer(visualTarget.msg, visualTarget.type);
            if (!visualBuffer || !visualBuffer.length) {
                throw new Error('Gagal mengunduh media visual.');
            }

            const audioSourceBuffer = audioTarget === visualTarget
                ? visualBuffer
                : await downloadMessageBuffer(audioTarget.msg, audioTarget.type);
            if (!audioSourceBuffer || !audioSourceBuffer.length) {
                throw new Error('Gagal mengunduh media audio.');
            }

            const [stickerBuffer, oggResult] = await Promise.all([
                visualToStickerBuffer(visualBuffer, visualTarget.mime, visualTarget.type, exifData),
                toOggOpus(audioSourceBuffer, tempFiles)
            ]);

            await sendAudioSticker(sock, remoteJid, m, stickerBuffer, oggResult);
            await msgData.react('✅');
        } catch (error) {
            console.error('Error in sticker-audio plugin:', error);
            await msgData.react('❌');

            if (error.message === 'NO_AUDIO_STREAM') {
                return msgData.reply('Uwaaa gomenasai kak, videonya nggak ada suaranya nih~ Kirim video bersuara atau gabungkan dengan audio/VN yaa (╥﹏╥)');
            }
            await msgData.reply(`Waaa gawat! Audio stikernya gagal dibuat: ${error.message || 'Terjadi kesalahan'}.. (｡T ω T｡)`);
        } finally {
            for (const filePath of tempFiles) {
                if (filePath && fs.existsSync(filePath)) {
                    fs.unlink(filePath, () => {});
                }
            }
        }
    }
};
