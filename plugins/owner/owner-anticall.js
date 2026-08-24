import Setting from '../../databases/orm/Setting.js';
import config from '../../config.js';
import { resolveLidToJid } from '../../libs/lid-resolver.js';

export default {
    command: ['anticall'],
    category: 'owner',
    description: 'Mengatur fitur proteksi Anti-Call dan auto-block penelpon ke chat pribadi bot.',
    isOwner: true,

    async execute(sock, m, msgData, user, group, plugins) {
        const [setting] = await Setting.findOrCreate({
            where: { id: 1 },
            defaults: { is_public: true, is_register: true, is_gconly: false, is_autogpt: false, is_anticall: false }
        });

        const arg = msgData.args[0]?.toLowerCase();

        if (arg === 'on' || arg === 'enable' || arg === '1') {
            await setting.update({ is_anticall: true });
            return sock.sendMessage(msgData.remoteJid, {
                text: `Horeee! Fitur *Anti-Call* berhasil diaktifkan! (˶˃ ᵕ ˂˶)\n\n` +
                    `Sekarang siapa pun yang menelpon atau video call ke chat pribadi nomor bot akan otomatis ditolak dan diblokir (kecuali nomor Owner & Bot) (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        if (arg === 'off' || arg === 'disable' || arg === '0') {
            await setting.update({ is_anticall: false });
            return sock.sendMessage(msgData.remoteJid, {
                text: `Selesai! Fitur *Anti-Call* telah dinonaktifkan yaa kak~ (｡T ω T｡)\n\nPanggilan suara & video sekarang diizinkan dan tidak akan diblokir.`
            }, { quoted: m });
        }

        // Tampilkan status & panduan jika argumen tidak ada atau salah
        const statusText = setting.is_anticall ? '🟢 *Aktif*' : '🔴 *Nonaktif*';
        const helpText = `╭─「 *PENGATURAN ANTI-CALL* 」\n` +
            `│ *Status saat ini:* ${statusText}\n` +
            `╰─────────────┈\n\n` +
            `*Cara Penggunaan:*\n` +
            `• \`.anticall on\` (Aktifkan proteksi anti-call)\n` +
            `• \`.anticall off\` (Matikan proteksi anti-call)\n` +
            `• \`.enable anticall\` / \`.disable anticall\`\n\n` +
            `_Catatan: Nomor Owner dan nomor bot sendiri tidak akan diblokir saat menelpon._ (๑>ᴗ<๑)`;

        return sock.sendMessage(msgData.remoteJid, { text: helpText.trim() }, { quoted: m });
    },

    async onCall(sock, calls) {
        try {
            const [setting] = await Setting.findOrCreate({
                where: { id: 1 },
                defaults: { is_public: true, is_register: true, is_gconly: false, is_autogpt: false, is_anticall: false }
            });

            if (!setting || !setting.is_anticall) return;

            const cleanNumber = (jid) => jid ? jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '') : '';
            const ownerNumbers = (config.OWNER_NUMBER || '')
                .split(',')
                .map(n => cleanNumber(n))
                .filter(Boolean);

            const botNum = cleanNumber(sock.user?.id) || cleanNumber(config.BOT_NUMBER);
            const botLidNum = cleanNumber(sock.user?.lid);

            for (const call of calls) {
                // Hanya proses saat status call adalah 'offer' (panggilan masuk yang sedang berdering)
                if (call.status !== 'offer') continue;

                // Jangan blokir panggilan grup, hanya panggilan chat pribadi ke bot
                if (call.isGroup || call.from?.endsWith('@g.us')) continue;

                let callerJid = resolveLidToJid(call.from, sock);
                if (callerJid?.endsWith('@lid') && sock?.signalRepository?.lidMapping) {
                    try {
                        const pn = await sock.signalRepository.lidMapping.getPNForLID(callerJid);
                        if (pn) {
                            callerJid = `${pn.split(':')[0].split('@')[0]}@s.whatsapp.net`;
                        }
                    } catch (e) {
                        // Abaikan error resolusi async
                    }
                }

                const callerNum = cleanNumber(callerJid);
                const rawCallerNum = cleanNumber(call.from);

                // Pengecualian: Nomor Owner dan Nomor Bot itu sendiri
                const isExempt = call.fromMe ||
                    ownerNumbers.includes(callerNum) ||
                    ownerNumbers.includes(rawCallerNum) ||
                    callerNum === botNum ||
                    rawCallerNum === botNum ||
                    (botLidNum && (callerNum === botLidNum || rawCallerNum === botLidNum));

                if (isExempt) continue;

                const callType = call.isVideo ? 'Video Call' : 'Panggilan Suara';

                // 1. Tolak Panggilan (Reject Call)
                try {
                    await sock.rejectCall(call.id, call.from);
                } catch (err) {
                    console.error('[Anti-Call] Gagal me-reject panggilan:', err.message);
                }

                // 2. Kirim pesan pemberitahuan sebelum blokir
                const rejectMsg = `⚠️ *Panggilan Ditolak & Nomor Diblokir!*\n\n` +
                    `Uwaaa! Maaf ya kak @${callerNum || rawCallerNum}, bot Ryzumi tidak menerima ${callType} ke chat pribadi! (｡T ω T｡)\n\n` +
                    `Sesuai aturan keamanan *Anti-Call*, nomor kakak telah diblokir secara otomatis oleh sistem.\n` +
                    `Jika tidak sengaja atau ingin membuka blokir, silakan hubungi Owner kami yaa~ (˶˃ ᵕ ˂˶)`;

                try {
                    await sock.sendMessage(call.from, {
                        text: rejectMsg,
                        mentions: [callerJid.endsWith('@s.whatsapp.net') ? callerJid : call.from]
                    });
                } catch (err) {
                    console.error('[Anti-Call] Gagal mengirim pesan penolakan:', err.message);
                }

                // 3. Blokir nomor penelpon
                try {
                    await sock.updateBlockStatus(call.from, 'block');
                    if (callerJid !== call.from && callerJid.endsWith('@s.whatsapp.net')) {
                        await sock.updateBlockStatus(callerJid, 'block').catch(() => {});
                    }
                    console.log(`[Anti-Call] 🚫 Berhasil memblokir ${callerNum || rawCallerNum} (${callType}).`);
                } catch (err) {
                    console.error('[Anti-Call] Gagal memblokir user:', err.message);
                }

                // 4. Kirim notifikasi ke Owner
                try {
                    const ownerTarget = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
                    await sock.sendMessage(ownerTarget, {
                        text: `🛡️ *[NOTIFIKASI ANTI-CALL]*\n\n` +
                            `Ryzumi baru saja memblokir penelpon otomatis nih kak!\n` +
                            `• *Nomor:* @${callerNum || rawCallerNum}\n` +
                            `• *Tipe:* ${callType}\n` +
                            `• *Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
                            `Sistem anti-call berjalan lancar! (๑>ᴗ<๑)`,
                        mentions: [callerJid.endsWith('@s.whatsapp.net') ? callerJid : call.from]
                    });
                } catch (err) {
                    // Abaikan jika notifikasi owner gagal
                }
            }
        } catch (error) {
            console.error('Anti-Call Handler Error:', error);
        }
    }
};
