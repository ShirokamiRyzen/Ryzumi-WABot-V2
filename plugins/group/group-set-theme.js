import {
    CHAT_THEME_PRESETS,
    groupPermissions,
    isWallpaperMessage,
    parseTheme,
    readImage,
    setThemeGroup,
    ThemeError,
} from '../../libs/group-theme.js';

const HELP = `*Panduan Tema Grup* (๑>ᴗ<๑)

• \`.tema pink\` — wallpaper warna solid
• \`.tema #121212 bubble pink-tonal\` — warna hex + bubble
• \`.tema preset pink\` — preset tema WhatsApp
• \`.tema bubble royal-blue\` — ubah warna bubble saja
• \`.tema gambar\` — reply foto/GIF/video
• \`.tema gambar bubble royal-blue\` — wallpaper + bubble
• \`.tema https://example.com/wallpaper.jpg\` — wallpaper dari URL
• \`.tema reset\` — kembalikan ke tema default
• \`.tema list\` — lihat daftar preset tema & bubble

_Catatan:_
Foto juga bisa langsung dikirim dengan caption \`.tema\` ya, Kak! Maksimal 10 MB, dan untuk GIF/video akan diambil frame pertamanya.
Perubahan hanya bisa dilakukan oleh admin grup atau owner bot~ (˶˃ ᵕ ˂˶)`;

export default {
    command: ['tema', 'settema', 'theme', 'settheme'],
    category: 'group',
    description: 'Mengatur tema, warna bubble, dan wallpaper grup.',
    isGroup: true,
    isAdmin: true,

    async execute(sock, m, msgData, user) {
        const text = msgData.args.join(' ');

        try {
            const hasMedia = isWallpaperMessage(msgData);
            const parsed = parseTheme(text, hasMedia);

            if (parsed.mode === 'help') {
                return msgData.reply(HELP);
            }

            if (parsed.mode === 'list') {
                const presetList = Object.keys(CHAT_THEME_PRESETS)
                    .map((key) => `• \`${key}\``)
                    .join('\n');
                return msgData.reply(
                    `*Daftar Preset Tema & Bubble* (˶˃ ᵕ ˂˶)\n\n${presetList}\n\nContoh: \`.tema preset pink\` atau \`.tema bubble royal-blue\``
                );
            }

            // Ambil metadata grup terbaru agar status admin & pembatasan info grup akurat
            const metadata = await sock.groupMetadata(msgData.remoteJid);
            if (!metadata || !Array.isArray(metadata.participants) || metadata.id !== msgData.remoteJid) {
                throw new ThemeError('GROUP', 'Metadata grup belum tersedia saat ini. Coba lagi sebentar ya, Kak!');
            }

            const permission = groupPermissions(sock, msgData, metadata, user?.isOwner === true);
            if (!permission.allowed) {
                return msgData.reply(
                    'Maaf ya Kak, cuma admin grup atau owner bot yang boleh mengubah tema grup ini~ (｡•́︿•̀｡)'
                );
            }

            if (permission.restricted && !permission.botAdmin) {
                return msgData.reply(
                    'Ryzumi harus jadi admin dulu supaya bisa mengubah tema grup yang membatasi edit info grup ya, Kak! (｡•́︿•̀｡)'
                );
            }

            const content = {};
            if (parsed.mode === 'reset') content.reset = true;
            if (parsed.mode === 'color') content.color = parsed.hex;
            if (parsed.mode === 'preset') content.theme = parsed.scheme;
            if (parsed.bubble) content.bubble = parsed.bubble;
            if (parsed.mode === 'wallpaper') {
                content.wallpaper = await readImage(msgData, parsed.url || null);
            }

            await setThemeGroup(sock, msgData.remoteJid, content, { metadata });
            return msgData.reply(
                `Yeay! Perubahan tema grup (${parsed.label}) sudah dikirim ke WhatsApp~ Coba cek tampilan grupnya ya, Kak! (˶˃ ᵕ ˂˶)`
            );
        } catch (error) {
            if (error?.acceptedMessageIds?.length) {
                return msgData.reply(
                    'Tema pertama sudah diterima, tapi perubahan berikutnya belum selesai. Cek grup dulu sebelum mencoba lagi ya, Kak! (╥﹏╥)\n' +
                        (error instanceof ThemeError
                            ? error.message
                            : 'Terjadi kesalahan saat memproses tema.')
                );
            }
            if (error instanceof ThemeError) {
                return msgData.reply(`Aduhh, gagal Kak~ ${error.message} (｡•́︿•̀｡)`);
            }
            console.error('[group-set-theme] Error:', error);
            return msgData.reply('Gomen ne... Ryzumi gagal mengubah tema grupnya (╥﹏╥)');
        }
    },
};
