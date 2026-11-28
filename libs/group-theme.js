import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { fileTypeFromBuffer } from 'file-type';
import {
    proto,
    prepareWAMessageMedia,
    generateMessageIDV2,
    encodeWAMessage,
    encodeSignedDeviceIdentity,
    isHostedLidUser,
    isHostedPnUser,
    getBinaryNodeChild,
    getBinaryNodeChildren,
} from 'baileys';
import { resolveLidToJid } from './lid-resolver.js';

const MAX_WALLPAPER_BYTES = 10 * 1024 * 1024; // 10 MB
const PROTOCOL_TYPE_CHAT_THEME_SETTING = 34;
const PROTO_PATCH_SYMBOL = Symbol.for('ryzumi.protocolMessage.chatThemeSetting.patched');

export class ThemeError extends Error {
    constructor(code, message, options = {}) {
        super(message);
        this.name = 'ThemeError';
        this.code = code;
        if (Array.isArray(options.acceptedMessageIds)) {
            this.acceptedMessageIds = options.acceptedMessageIds;
        }
    }
}

export const CHAT_THEME_PRESETS = Object.freeze({
    default: 'Default',
    pink: 'Pink',
    'pink-tonal': 'Pink@Tonal',
    'royal-blue': 'Royal-Blue',
    'royal-blue-tonal': 'Royal-Blue@Tonal',
    'sky-blue': 'Sky-Blue',
    'sky-blue-tonal': 'Sky-Blue@Tonal',
    blue: 'Blue',
    'blue-tonal': 'Blue@Tonal',
    teal: 'Teal',
    'teal-tonal': 'Teal@Tonal',
    green: 'Green',
    'green-tonal': 'Green@Tonal',
    emerald: 'Emerald',
    'emerald-tonal': 'Emerald@Tonal',
    mint: 'Mint',
    'mint-tonal': 'Mint@Tonal',
    lime: 'Lime',
    'lime-tonal': 'Lime@Tonal',
    yellow: 'Yellow',
    'yellow-tonal': 'Yellow@Tonal',
    orange: 'Orange',
    'orange-tonal': 'Orange@Tonal',
    coral: 'Coral',
    'coral-tonal': 'Coral@Tonal',
    red: 'Red',
    'red-tonal': 'Red@Tonal',
    rose: 'Rose',
    'rose-tonal': 'Rose@Tonal',
    purple: 'Purple',
    'purple-tonal': 'Purple@Tonal',
    lavender: 'Lavender',
    'lavender-tonal': 'Lavender@Tonal',
    indigo: 'Indigo',
    'indigo-tonal': 'Indigo@Tonal',
    brown: 'Brown',
    'brown-tonal': 'Brown@Tonal',
    gray: 'Gray',
    'gray-tonal': 'Gray@Tonal',
    monochrome: 'Monochrome',
    'monochrome-tonal': 'Monochrome@Tonal',
});

export const SOLID_COLORS = Object.freeze({
    pink: '#F8BBD0',
    merah: '#E53935',
    red: '#E53935',
    biru: '#1E88E5',
    blue: '#1E88E5',
    'royal-blue': '#2962FF',
    'sky-blue': '#4FC3F7',
    hijau: '#43A047',
    green: '#43A047',
    mint: '#80CBC4',
    emerald: '#00897B',
    teal: '#008080',
    kuning: '#FDD835',
    yellow: '#FDD835',
    oranye: '#FB8C00',
    orange: '#FB8C00',
    coral: '#FF7043',
    ungu: '#8E24AA',
    purple: '#8E24AA',
    lavender: '#B39DDB',
    indigo: '#3949AB',
    rose: '#EC407A',
    coklat: '#6D4C41',
    brown: '#6D4C41',
    hitam: '#121212',
    black: '#121212',
    dark: '#121212',
    gelap: '#121212',
    putih: '#FAFAFA',
    white: '#FAFAFA',
    abu: '#607D8B',
    gray: '#607D8B',
    grey: '#607D8B',
    cyan: '#00ACC1',
    navy: '#1A237E',
    maroon: '#880E4F',
    gold: '#FFB300',
    cream: '#FFF8E1',
});

function normalizeKey(str) {
    return String(str || '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-');
}

function normalizeHex(input) {
    const raw = String(input || '').trim();
    const match = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!match) return null;
    let hex = match[1].toUpperCase();
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((ch) => ch + ch)
            .join('');
    }
    return `#${hex}`;
}

function resolveColor(token) {
    const hex = normalizeHex(token);
    if (hex) return { hex, name: hex };
    const key = normalizeKey(token);
    if (SOLID_COLORS[key]) {
        return { hex: SOLID_COLORS[key], name: `${key} (${SOLID_COLORS[key]})` };
    }
    return null;
}

function resolvePreset(token) {
    const key = normalizeKey(token);
    if (CHAT_THEME_PRESETS[key]) {
        return { key, scheme: CHAT_THEME_PRESETS[key] };
    }
    return null;
}

function isHttpUrl(str) {
    try {
        const u = new URL(str);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

export function parseTheme(text, hasMedia = false) {
    const trimmed = String(text || '').trim();

    if (!trimmed) {
        if (hasMedia) {
            return { mode: 'wallpaper', label: 'wallpaper gambar' };
        }
        return { mode: 'help' };
    }

    const tokens = trimmed.split(/\s+/);
    const first = tokens[0].toLowerCase();

    if (first === 'help' || first === 'bantuan' || first === '?') {
        return { mode: 'help' };
    }

    if (first === 'list' || first === 'daftar') {
        return { mode: 'list' };
    }

    if (first === 'reset' || first === 'default' || first === 'clear' || first === 'hapus') {
        return { mode: 'reset', label: 'reset tema ke default' };
    }

    // Extract optional "bubble <preset>" clause
    let bubblePreset = null;
    const bubbleIdx = tokens.findIndex((t) => t.toLowerCase() === 'bubble');
    let mainTokens = tokens;

    if (bubbleIdx !== -1) {
        const bubbleArg = tokens[bubbleIdx + 1];
        if (!bubbleArg) {
            throw new ThemeError(
                'INVALID_BUBBLE',
                'Nama preset bubble belum diisi. Contoh: .tema bubble royal-blue (gunakan .tema list untuk melihat daftar).'
            );
        }
        const resolvedBubble = resolvePreset(bubbleArg);
        if (!resolvedBubble) {
            throw new ThemeError(
                'INVALID_BUBBLE',
                `Preset bubble "${bubbleArg}" tidak dikenal. Ketik .tema list untuk melihat daftar preset.`
            );
        }
        bubblePreset = resolvedBubble;
        mainTokens = [...tokens.slice(0, bubbleIdx), ...tokens.slice(bubbleIdx + 2)];
    }

    if (mainTokens.length === 0) {
        if (bubblePreset) {
            return {
                mode: 'bubble',
                bubble: bubblePreset.scheme,
                label: `bubble ${bubblePreset.key}`,
            };
        }
        return { mode: 'help' };
    }

    const head = mainTokens[0].toLowerCase();

    if (head === 'preset') {
        const presetArg = mainTokens.slice(1).join('-');
        if (!presetArg) {
            return { mode: 'list' };
        }
        const resolved = resolvePreset(presetArg);
        if (!resolved) {
            throw new ThemeError(
                'INVALID_PRESET',
                `Preset "${presetArg}" tidak ditemukan. Ketik .tema list untuk melihat daftar preset.`
            );
        }
        return {
            mode: 'preset',
            scheme: resolved.scheme,
            bubble: bubblePreset?.scheme,
            label: bubblePreset
                ? `preset ${resolved.key} + bubble ${bubblePreset.key}`
                : `preset ${resolved.key}`,
        };
    }

    if (head === 'gambar' || head === 'image' || head === 'foto' || head === 'wallpaper') {
        if (!hasMedia) {
            throw new ThemeError(
                'NO_MEDIA',
                'Reply foto/GIF/video atau kirim media dengan caption .tema gambar.'
            );
        }
        return {
            mode: 'wallpaper',
            bubble: bubblePreset?.scheme,
            label: bubblePreset
                ? `wallpaper gambar + bubble ${bubblePreset.key}`
                : 'wallpaper gambar',
        };
    }

    if (isHttpUrl(mainTokens[0])) {
        return {
            mode: 'wallpaper',
            url: mainTokens[0],
            bubble: bubblePreset?.scheme,
            label: bubblePreset
                ? `wallpaper URL + bubble ${bubblePreset.key}`
                : 'wallpaper dari URL',
        };
    }

    const colorCandidate = mainTokens.join('-');
    const color = resolveColor(colorCandidate);
    if (color) {
        return {
            mode: 'color',
            hex: color.hex,
            bubble: bubblePreset?.scheme,
            label: bubblePreset
                ? `warna ${color.name} + bubble ${bubblePreset.key}`
                : `warna ${color.name}`,
        };
    }

    const presetFallback = resolvePreset(colorCandidate);
    if (presetFallback) {
        return {
            mode: 'preset',
            scheme: presetFallback.scheme,
            bubble: bubblePreset?.scheme,
            label: bubblePreset
                ? `preset ${presetFallback.key} + bubble ${bubblePreset.key}`
                : `preset ${presetFallback.key}`,
        };
    }

    throw new ThemeError(
        'INVALID_INPUT',
        `Argumen "${trimmed}" tidak dikenali. Ketik .tema untuk bantuan atau .tema list untuk daftar preset.`
    );
}

export function isWallpaperMessage(msgData) {
    if (!msgData) return false;

    const checkTypeAndMime = (type, mime) => {
        if (type === 'imageMessage' || type === 'videoMessage') return true;
        if (type === 'documentMessage' && /^(image|video)\//i.test(mime || '')) return true;
        return false;
    };

    if (msgData.isMedia && checkTypeAndMime(msgData.messageType, msgData.mime)) {
        return true;
    }
    if (msgData.isQuotedMedia && checkTypeAndMime(msgData.quotedType, msgData.quotedMime)) {
        return true;
    }
    return false;
}

async function extractFirstVideoFrame(buffer, ext = 'mp4') {
    const tmpDir = os.tmpdir();
    const id = `ryzumi-theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inputPath = path.join(tmpDir, `${id}.${ext}`);
    const outputPath = path.join(tmpDir, `${id}.jpg`);

    try {
        await fs.promises.writeFile(inputPath, buffer);
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .frames(1)
                .outputOptions(['-q:v', '2'])
                .output(outputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        return await fs.promises.readFile(outputPath);
    } finally {
        await Promise.allSettled([
            fs.promises.unlink(inputPath),
            fs.promises.unlink(outputPath),
        ]);
    }
}

async function normalizeWallpaperImage(rawBuffer) {
    if (!Buffer.isBuffer(rawBuffer) || rawBuffer.length === 0) {
        throw new ThemeError('EMPTY_MEDIA', 'File media kosong atau tidak bisa dibaca.');
    }

    if (rawBuffer.length > MAX_WALLPAPER_BYTES) {
        throw new ThemeError('MEDIA_TOO_LARGE', 'Ukuran file melebihi batas maksimal 10 MB.');
    }

    const detected = await fileTypeFromBuffer(rawBuffer).catch(() => null);
    let imageBuffer = rawBuffer;

    if (detected?.mime?.startsWith('video/')) {
        try {
            imageBuffer = await extractFirstVideoFrame(rawBuffer, detected.ext || 'mp4');
        } catch (err) {
            throw new ThemeError(
                'VIDEO_FRAME_ERROR',
                `Gagal mengambil frame pertama dari video/GIF: ${err.message}`
            );
        }
    } else if (detected && !detected.mime.startsWith('image/')) {
        throw new ThemeError(
            'UNSUPPORTED_MEDIA',
            `Format file (${detected.mime}) tidak didukung. Gunakan foto, GIF, atau video.`
        );
    }

    try {
        return await sharp(imageBuffer, { animated: false, pages: 1 })
            .rotate()
            .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 88, mozjpeg: true })
            .toBuffer();
    } catch (err) {
        throw new ThemeError(
            'IMAGE_PROCESS_ERROR',
            `Gagal memproses gambar wallpaper: ${err.message}`
        );
    }
}

export async function readImage(msgData, url = null) {
    let rawBuffer;

    if (url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 20000,
                maxContentLength: MAX_WALLPAPER_BYTES,
                maxBodyLength: MAX_WALLPAPER_BYTES,
                headers: { 'User-Agent': 'Mozilla/5.0' },
            });
            rawBuffer = Buffer.from(response.data);
        } catch (err) {
            throw new ThemeError(
                'URL_DOWNLOAD_ERROR',
                `Gagal mengunduh wallpaper dari URL: ${err.message}`
            );
        }
    } else {
        const mediaObj =
            (msgData.isMedia && msgData.msg?.[msgData.messageType]) ||
            (msgData.isQuotedMedia && msgData.quotedMsg?.[msgData.quotedType]);

        const declaredLength = Number(mediaObj?.fileLength || 0);
        if (declaredLength > MAX_WALLPAPER_BYTES) {
            throw new ThemeError('MEDIA_TOO_LARGE', 'Ukuran media melebihi batas maksimal 10 MB.');
        }

        try {
            rawBuffer = await msgData.downloadMedia();
        } catch (err) {
            throw new ThemeError(
                'MEDIA_DOWNLOAD_ERROR',
                `Gagal mengunduh media dari WhatsApp: ${err.message}`
            );
        }
    }

    return normalizeWallpaperImage(rawBuffer);
}

export function groupPermissions(sock, msgData, metadata, isOwner = false) {
    const jidToNum = (jid) => String(jid || '').split('@')[0].split(':')[0];

    const senderNum = jidToNum(resolveLidToJid(msgData.senderJid, sock));
    const botId = sock?.user?.id || '';
    const botLid = sock?.user?.lid || '';
    const botNum = jidToNum(botId);

    const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];

    const senderParticipant = participants.find(
        (p) =>
            p.id === msgData.senderJid ||
            p.phoneNumber === msgData.senderJid ||
            jidToNum(resolveLidToJid(p.id, sock)) === senderNum ||
            (p.phoneNumber && jidToNum(p.phoneNumber) === senderNum)
    );

    const botParticipant = participants.find(
        (p) =>
            p.id === botId ||
            p.id === botLid ||
            jidToNum(resolveLidToJid(p.id, sock)) === botNum ||
            (p.phoneNumber && jidToNum(p.phoneNumber) === botNum)
    );

    const isAdmin = Boolean(senderParticipant?.admin);
    const botAdmin = Boolean(botParticipant?.admin);
    const restricted = Boolean(metadata?.restrict);

    return {
        isAdmin,
        botAdmin,
        restricted,
        allowed: Boolean(isOwner || isAdmin),
    };
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

function rgbaToArgbUint32(a, r, g, b) {
    return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
}

function buildSolidColorWallpaper(hex) {
    const { r, g, b } = hexToRgb(hex);
    const darkR = Math.round(r * 0.45);
    const darkG = Math.round(g * 0.45);
    const darkB = Math.round(b * 0.45);

    return {
        backgroundLightArgb: rgbaToArgbUint32(0xff, r, g, b),
        backgroundDarkArgb: rgbaToArgbUint32(0xff, darkR, darkG, darkB),
        isDoodleEnabled: true,
        doodleLightArgb: rgbaToArgbUint32(0x1f, 0x00, 0x00, 0x00),
        doodleDarkArgb: rgbaToArgbUint32(0x1f, 0xff, 0xff, 0xff),
    };
}

function encodeChatThemeSetting(setting, w) {
    if (setting.settingTimestampMs != null) {
        w.uint32(8).int64(setting.settingTimestampMs);
    }
    if (setting.clearTheme != null) {
        w.uint32(16).bool(Boolean(setting.clearTheme));
    }
    if (setting.colorSchemeId != null) {
        w.uint32(26).string(String(setting.colorSchemeId));
    }
    if (setting.defaultWallpaper != null) {
        const sub = w.uint32(82).fork();
        if (setting.defaultWallpaper.isDoodleEnabled != null) {
            sub.uint32(8).bool(Boolean(setting.defaultWallpaper.isDoodleEnabled));
        }
        sub.ldelim();
    } else if (setting.solidColor != null) {
        const sc = setting.solidColor;
        const sub = w.uint32(90).fork();
        if (sc.backgroundLightArgb != null) sub.uint32(13).fixed32(sc.backgroundLightArgb >>> 0);
        if (sc.backgroundDarkArgb != null) sub.uint32(21).fixed32(sc.backgroundDarkArgb >>> 0);
        if (sc.isDoodleEnabled != null) sub.uint32(24).bool(Boolean(sc.isDoodleEnabled));
        if (sc.doodleLightArgb != null) sub.uint32(37).fixed32(sc.doodleLightArgb >>> 0);
        if (sc.doodleDarkArgb != null) sub.uint32(45).fixed32(sc.doodleDarkArgb >>> 0);
        sub.ldelim();
    } else if (setting.stockImage != null) {
        const si = setting.stockImage;
        const sub = w.uint32(98).fork();
        if (si.stockImageId != null) sub.uint32(10).string(String(si.stockImageId));
        if (si.dimLevel != null) sub.uint32(21).float(Number(si.dimLevel));
        sub.ldelim();
    } else if (setting.customImage != null) {
        const ci = setting.customImage;
        const sub = w.uint32(106).fork();
        if (ci.directPath != null) sub.uint32(10).string(String(ci.directPath));
        if (ci.mediaKey != null) sub.uint32(18).bytes(ci.mediaKey);
        if (ci.fileEncSha256 != null) sub.uint32(26).bytes(ci.fileEncSha256);
        if (ci.fileSha256 != null) sub.uint32(34).bytes(ci.fileSha256);
        if (ci.dimLevel != null) sub.uint32(45).float(Number(ci.dimLevel));
        sub.ldelim();
    } else if (setting.animatedWallpaper != null) {
        const aw = setting.animatedWallpaper;
        const sub = w.uint32(114).fork();
        if (aw.animatedWallpaperId != null) sub.uint32(10).string(String(aw.animatedWallpaperId));
        if (aw.dimLevel != null) sub.uint32(21).float(Number(aw.dimLevel));
        sub.ldelim();
    }
    return w;
}

function decodeChatThemeSetting(reader, length) {
    const end = length === undefined ? reader.len : reader.pos + length;
    const out = {};
    while (reader.pos < end) {
        const tag = reader.uint32();
        const field = tag >>> 3;
        const wire = tag & 7;
        if (field === 1 && wire === 0) out.settingTimestampMs = Number(reader.int64());
        else if (field === 2 && wire === 0) out.clearTheme = reader.bool();
        else if (field === 3 && wire === 2) out.colorSchemeId = reader.string();
        else if (field === 13 && wire === 2) {
            const subEnd = reader.pos + reader.uint32();
            const ci = {};
            while (reader.pos < subEnd) {
                const st = reader.uint32();
                const sf = st >>> 3;
                const sw = st & 7;
                if (sf === 1 && sw === 2) ci.directPath = reader.string();
                else if (sf === 2 && sw === 2) ci.mediaKeyB64 = Buffer.from(reader.bytes()).toString('base64');
                else if (sf === 3 && sw === 2) ci.fileEncSha256B64 = Buffer.from(reader.bytes()).toString('base64');
                else if (sf === 4 && sw === 2) ci.fileSha256B64 = Buffer.from(reader.bytes()).toString('base64');
                else if (sf === 5 && sw === 5) ci.dimLevel = reader.float();
                else {
                    ci[`unknown_${sf}_w${sw}`] = true;
                    reader.skipType(sw);
                }
            }
            out.customImage = ci;
        } else {
            out[`field_${field}_w${wire}`] = true;
            reader.skipType(wire);
        }
    }
    return out;
}

export function ensureChatThemeProtoPatch() {
    const ProtocolMessage = proto?.Message?.ProtocolMessage;
    if (!ProtocolMessage || ProtocolMessage[PROTO_PATCH_SYMBOL]) return;

    const originalEncode = ProtocolMessage.encode.bind(ProtocolMessage);
    ProtocolMessage.encode = function patchedEncode(message, writer) {
        const w = originalEncode(message, writer);
        if (message && message.chatThemeSetting != null) {
            encodeChatThemeSetting(message.chatThemeSetting, w.uint32(242).fork()).ldelim();
        }
        return w;
    };

    const originalDecode = ProtocolMessage.decode.bind(ProtocolMessage);
    ProtocolMessage.decode = function patchedDecode(reader, length) {
        const startPos = reader.pos;
        const end = length === undefined ? reader.len : reader.pos + length;
        const msg = originalDecode(reader, length);
        if (msg && msg.type === PROTOCOL_TYPE_CHAT_THEME_SETTING) {
            const savedPos = reader.pos;
            reader.pos = startPos;
            while (reader.pos < end) {
                const tag = reader.uint32();
                const field = tag >>> 3;
                const wire = tag & 7;
                if (field === 30 && wire === 2) {
                    msg.chatThemeSetting = decodeChatThemeSetting(reader, reader.uint32());
                } else {
                    reader.skipType(wire);
                }
            }
            reader.pos = savedPos;
        }
        return msg;
    };

    ProtocolMessage[PROTO_PATCH_SYMBOL] = true;
}

ensureChatThemeProtoPatch();

function encryptWallpaperMedia(plainBuffer, hkdfInfo = 'WhatsApp Image Keys') {
    const mediaKey = crypto.randomBytes(32);
    const expanded = Buffer.from(
        crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(0), Buffer.from(hkdfInfo), 112)
    );
    const iv = expanded.subarray(0, 16);
    const cipherKey = expanded.subarray(16, 48);
    const macKey = expanded.subarray(48, 80);

    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const mac = crypto
        .createHmac('sha256', macKey)
        .update(iv)
        .update(ciphertext)
        .digest()
        .subarray(0, 10);

    const encBuffer = Buffer.concat([ciphertext, mac]);
    const fileSha256 = crypto.createHash('sha256').update(plainBuffer).digest();
    const fileEncSha256 = crypto.createHash('sha256').update(encBuffer).digest();

    return { encBuffer, mediaKey, fileSha256, fileEncSha256 };
}

function toUploadToken(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function fetchMediaConnWithBuckets(sock) {
    const result = await sock.query({
        tag: 'iq',
        attrs: {
            type: 'set',
            xmlns: 'w:m',
            to: 's.whatsapp.net',
        },
        content: [{ tag: 'media_conn', attrs: {} }],
    });

    const mediaConnNode = getBinaryNodeChild(result, 'media_conn');
    if (!mediaConnNode) throw new Error('media_conn tidak ditemukan');

    const hostNodes = getBinaryNodeChildren(mediaConnNode, 'host');
    const hosts = hostNodes.map((h) => ({
        hostname: h.attrs.hostname,
        type: h.attrs.type,
        children: Array.isArray(h.content)
            ? h.content.map((c) => ({ tag: c.tag, attrs: c.attrs, sub: Array.isArray(c.content) ? c.content.map((s) => s.tag) : [] }))
            : [],
    }));

    return {
        auth: mediaConnNode.attrs.auth,
        hosts,
    };
}

const WALLPAPER_BUCKET_CANDIDATES = [
    'chat_theme',
    'chat-theme',
    'chat_theme_wallpaper',
    'chat-theme-wallpaper',
    'wallpaper',
    'chat_wallpaper',
    'chat-wallpaper',
    'theme_wallpaper',
    'theme-wallpaper',
    'custom_wallpaper',
    'custom-wallpaper',
    'theme',
    'background',
    'chat_background',
    'chat-background',
];

async function uploadCustomWallpaper(sock, imageBuffer) {
    if (typeof sock?.query === 'function') {
        try {
            const mediaConn = await fetchMediaConnWithBuckets(sock);
            const primaryHost = mediaConn.hosts.find((h) => h.hostname);
            console.log('[group-theme] media_conn primary host:', JSON.stringify(primaryHost));

            if (primaryHost) {
                const { encBuffer, mediaKey, fileSha256, fileEncSha256 } =
                    encryptWallpaperMedia(imageBuffer, 'WhatsApp Image Keys');
                const token = toUploadToken(fileEncSha256);
                const auth = encodeURIComponent(mediaConn.auth);

                const results = await Promise.all(
                    WALLPAPER_BUCKET_CANDIDATES.map(async (bucket) => {
                        const url = `https://${primaryHost.hostname}/mms/${bucket}/${token}?auth=${auth}&token=${token}`;
                        try {
                            const res = await axios.post(url, encBuffer, {
                                headers: {
                                    'Content-Type': 'application/octet-stream',
                                    Origin: 'https://web.whatsapp.com',
                                },
                                timeout: 15000,
                                maxBodyLength: Infinity,
                                maxContentLength: Infinity,
                                validateStatus: () => true,
                            });
                            return { bucket, status: res.status, data: res.data };
                        } catch (e) {
                            return { bucket, status: 0, error: e.message };
                        }
                    })
                );

                console.log(
                    '[group-theme] bucket probe:',
                    results.map((r) => `${r.bucket}:${r.status}${r.data?.direct_path ? '->' + r.data.direct_path.slice(0, 24) : ''}`).join(', ')
                );

                const hit = results.find((r) => r.status === 200 && (r.data?.direct_path || r.data?.url));
                if (hit) {
                    console.log('[group-theme] Uploaded wallpaper via bucket:', hit.bucket, hit.data.direct_path);
                    return {
                        directPath: hit.data.direct_path,
                        mediaKey,
                        fileEncSha256,
                        fileSha256,
                    };
                }
            }
        } catch (err) {
            console.error('[group-theme] Bucket upload fallback:', err.message);
        }
    }

    if (typeof sock?.waUploadToServer !== 'function') {
        throw new ThemeError(
            'UNSUPPORTED_TRANSPORT',
            'Transport Baileys tidak mendukung upload media wallpaper.'
        );
    }

    const uploaded = await prepareWAMessageMedia(
        { image: imageBuffer },
        { upload: sock.waUploadToServer }
    );

    const img = uploaded?.imageMessage;
    if (!img?.directPath || !img?.mediaKey || !img?.fileEncSha256 || !img?.fileSha256) {
        throw new ThemeError('UPLOAD_FAILED', 'Upload wallpaper ke server WhatsApp tidak lengkap.');
    }

    return {
        directPath: img.directPath,
        mediaKey: img.mediaKey,
        fileEncSha256: img.fileEncSha256,
        fileSha256: img.fileSha256,
    };
}

function waitForMessageAck(sock, messageId, timeoutMs = 10000) {
    if (!sock?.ws || typeof sock.ws.on !== 'function') {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        let settled = false;
        const onAck = (node) => {
            if (node?.attrs?.id !== messageId) return;
            cleanup();
            resolve(node);
        };
        const cleanup = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (typeof sock.ws.off === 'function') {
                sock.ws.off('CB:ack,class:message', onAck);
            } else if (typeof sock.ws.removeListener === 'function') {
                sock.ws.removeListener('CB:ack,class:message', onAck);
            }
        };
        const timer = setTimeout(() => {
            cleanup();
            resolve(null);
        }, timeoutMs);

        sock.ws.on('CB:ack,class:message', onAck);
    });
}

async function relayGroupThemeStanza(sock, groupJid, protocolPayload, { messageId, metadata }) {
    const canSendRaw =
        typeof sock?.sendNode === 'function' &&
        typeof sock?.signalRepository?.encryptGroupMessage === 'function' &&
        typeof sock?.getUSyncDevices === 'function' &&
        typeof sock?.assertSessions === 'function' &&
        typeof sock?.createParticipantNodes === 'function' &&
        sock?.authState?.keys;

    if (!canSendRaw) {
        return sock.relayMessage(groupJid, protocolPayload, {
            messageId,
            useCachedGroupMetadata: Boolean(metadata),
        });
    }

    const groupData = metadata || (await sock.groupMetadata(groupJid));
    const participantsList = Array.isArray(groupData?.participants)
        ? groupData.participants.map((p) => p.id)
        : [];

    const senderKeyResult = await sock.authState.keys.get('sender-key-memory', [groupJid]);
    const senderKeyMap = senderKeyResult?.[groupJid] || {};

    const devices = await sock.getUSyncDevices(participantsList, true, false);
    const bytes = encodeWAMessage(protocolPayload);

    const meId = sock.authState?.creds?.me?.id || sock.user?.id;
    const meLid = sock.authState?.creds?.me?.lid || sock.user?.lid;
    const groupAddressingMode = groupData?.addressingMode || 'lid';
    const groupSenderIdentity = groupAddressingMode === 'lid' && meLid ? meLid : meId;

    const { ciphertext, senderKeyDistributionMessage } =
        await sock.signalRepository.encryptGroupMessage({
            group: groupJid,
            data: bytes,
            meId: groupSenderIdentity,
        });

    const extraAttrs = { mediatype: 'chat_theme' };
    const senderKeyRecipients = [];
    for (const device of devices) {
        const deviceJid = device.jid;
        if (
            !senderKeyMap[deviceJid] &&
            !isHostedLidUser(deviceJid) &&
            !isHostedPnUser(deviceJid) &&
            device.device !== 99
        ) {
            senderKeyRecipients.push(deviceJid);
            senderKeyMap[deviceJid] = true;
        }
    }

    const binaryNodeContent = [];
    let shouldIncludeDeviceIdentity = false;

    if (senderKeyRecipients.length > 0) {
        const senderKeyMsg = {
            senderKeyDistributionMessage: {
                axolotlSenderKeyDistributionMessage: senderKeyDistributionMessage,
                groupId: groupJid,
            },
        };
        await sock.assertSessions(senderKeyRecipients);
        const result = await sock.createParticipantNodes(
            senderKeyRecipients,
            senderKeyMsg,
            extraAttrs
        );
        shouldIncludeDeviceIdentity = Boolean(result.shouldIncludeDeviceIdentity);
        if (result.nodes?.length) {
            binaryNodeContent.push({
                tag: 'participants',
                attrs: {},
                content: result.nodes,
            });
        }
    }

    binaryNodeContent.push({
        tag: 'enc',
        attrs: { v: '2', type: 'skmsg', ...extraAttrs },
        content: ciphertext,
    });

    if (shouldIncludeDeviceIdentity && sock.authState?.creds?.account) {
        binaryNodeContent.push({
            tag: 'device-identity',
            attrs: {},
            content: encodeSignedDeviceIdentity(sock.authState.creds.account, true),
        });
    }

    await sock.authState.keys.set({ 'sender-key-memory': { [groupJid]: senderKeyMap } });

    const attrs = {
        id: messageId,
        to: groupJid,
        type: 'media',
        addressing_mode: groupAddressingMode,
    };
    if (groupData?.ephemeralDuration && groupData.ephemeralDuration > 0) {
        attrs.expiration = groupData.ephemeralDuration.toString();
    }

    await sock.sendNode({
        tag: 'message',
        attrs,
        content: binaryNodeContent,
    });

    return messageId;
}

export async function setThemeGroup(sock, groupJid, content = {}, options = {}) {
    if (!groupJid || !groupJid.endsWith('@g.us')) {
        throw new ThemeError('INVALID_GROUP', 'Target JID bukan grup WhatsApp yang valid.');
    }

    if (typeof sock?.relayMessage !== 'function' && typeof sock?.sendNode !== 'function') {
        throw new ThemeError('UNSUPPORTED_TRANSPORT', 'Socket tidak mendukung pengiriman tema.');
    }

    ensureChatThemeProtoPatch();

    const acceptedMessageIds = [];
    const nowMs = Date.now();
    const chatThemeSetting = {
        settingTimestampMs: nowMs,
    };

    if (content.reset) {
        chatThemeSetting.clearTheme = true;
        chatThemeSetting.defaultWallpaper = { isDoodleEnabled: true };
    } else {
        if (content.bubble) {
            chatThemeSetting.colorSchemeId = content.bubble;
        } else if (content.theme) {
            chatThemeSetting.colorSchemeId = content.theme;
        }

        if (content.color) {
            chatThemeSetting.solidColor = buildSolidColorWallpaper(content.color);
        } else if (content.wallpaper) {
            const buffer = Buffer.isBuffer(content.wallpaper)
                ? content.wallpaper
                : await readImage(null, content.wallpaper);
            chatThemeSetting.customImage = await uploadCustomWallpaper(sock, buffer);
        }
    }

    const protocolPayload = {
        protocolMessage: {
            type: PROTOCOL_TYPE_CHAT_THEME_SETTING,
            timestampMs: nowMs,
            chatThemeSetting,
        },
    };

    const messageId = generateMessageIDV2(sock?.user?.id);
    const ackPromise = waitForMessageAck(sock, messageId, 10000);

    try {
        const sentId = await relayGroupThemeStanza(sock, groupJid, protocolPayload, {
            messageId,
            metadata: options.metadata,
        });

        const ack = await ackPromise;
        if (ack?.attrs?.error) {
            throw new ThemeError(
                'WA_ACK_ERROR',
                `Server WhatsApp menolak perubahan tema (error ${ack.attrs.error}).`,
                { acceptedMessageIds }
            );
        }

        if (sentId) acceptedMessageIds.push(sentId);
        return { messageIds: acceptedMessageIds, chatThemeSetting, ack: ack?.attrs || null };
    } catch (err) {
        if (err instanceof ThemeError) throw err;
        console.error('[group-theme] Relay error:', err);
        throw new ThemeError(
            'RELAY_FAILED',
            `Gagal mengirim perubahan tema grup ke WhatsApp: ${err.message}`,
            { acceptedMessageIds }
        );
    }
}
