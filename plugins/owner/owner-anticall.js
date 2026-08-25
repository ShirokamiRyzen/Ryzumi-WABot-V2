import Setting from '../../databases/orm/Setting.js';
import config from '../../config.js';
import { resolveLidToJid } from '../../libs/lid-resolver.js';

// Cache untuk deduplikasi event call agar tidak diproses berulang-ulang
const processedCalls = new Set();

/**
 * Helper untuk memblokir JID secara aman dengan fallback raw IQ query jika Baileys Boom error
 */
async function blockUser(sock, jid, lid) {
    if (!jid) return false;

    // 1. Coba method standar Baileys
    try {
        await sock.updateBlockStatus(jid, 'block');
        return true;
    } catch (err) {
        // Lanjut ke fallback raw query
    }

    // 2. Fallback kirim stanza IQ blocklist WhatsApp langsung
    try {
        const itemAttrs = { action: 'block', jid: lid || jid };
        if (jid.endsWith('@s.whatsapp.net')) {
            itemAttrs.pn_jid = jid;
        }

        await sock.query({
            tag: 'iq',
            attrs: {
                xmlns: 'blocklist',
                to: 's.whatsapp.net',
                type: 'set'
            },
            content: [
                {
                    tag: 'item',
                    attrs: itemAttrs
                }
            ]
        });
        return true;
    } catch (err) {
        // Fallback minimalis
        try {
            await sock.query({
                tag: 'iq',
                attrs: {
                    xmlns: 'blocklist',
                    to: 's.whatsapp.net',
                    type: 'set'
                },
                content: [
                    {
                        tag: 'item',
                        attrs: { action: 'block', jid: jid }
                    }
                ]
            });
            return true;
        } catch (e) {
            console.error(`[Anti-Call] Gagal memblokir ${jid}:`, e.message);
            return false;
        }
    }
}

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
                    `Sekarang siapa pun yang menelpon atau video call ke chat pribadi nomor bot akan otomatis langsung ditolak dan diblokir tanpa chat (kecuali nomor Owner & Bot) (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        if (arg === 'off' || arg === 'disable' || arg === '0') {
            await setting.update({ is_anticall: false });
            return sock.sendMessage(msgData.remoteJid, {
                text: `Selesai! Fitur *Anti-Call* telah dinonaktifkan yaa kak~ (｡T ω T｡)\n\nPanggilan suara & video sekarang diizinkan dan tidak akan diblokir.`
            }, { quoted: m });
        }

        const statusText = setting.is_anticall ? '🟢 *Aktif*' : '🔴 *Nonaktif*';
        const helpText = `╭─「 *PENGATURAN ANTI-CALL* 」\n` +
            `│ *Status saat ini:* ${statusText}\n` +
            `╰─────────────┈\n\n` +
            `*Cara Penggunaan:*\n` +
            `• \`.anticall on\` (Aktifkan proteksi anti-call)\n` +
            `• \`.anticall off\` (Matikan proteksi anti-call)\n` +
            `• \`.enable anticall\` / \`.disable anticall\`\n\n` +
            `_Catatan: Panggilan pribadi akan langsung di-reject dan diblokir seketika tanpa mengirim pesan ke penelpon._ (๑>ᴗ<๑)`;

        return sock.sendMessage(msgData.remoteJid, { text: helpText.trim() }, { quoted: m });
    },

    async onCall(sock, calls) {
        try {
            const [setting] = await Setting.findOrCreate({
                where: { id: 1 },
                defaults: { is_public: true, is_register: true, is_gconly: false, is_autogpt: false, is_anticall: false }
            });

            if (!setting || !setting.is_anticall) return;

            const cleanNum = (str) => (str || '').replace(/[^0-9]/g, '');
            const ownerNums = (config.OWNER_NUMBER || '').split(',').map(cleanNum).filter(Boolean);
            const botNum = cleanNum(sock.user?.id) || cleanNum(config.BOT_NUMBER);
            const botLidNum = cleanNum(sock.user?.lid);

            for (const call of calls) {
                // Hanya proses status 'offer' (panggilan masuk yang pertama kali masuk)
                if (call.status !== 'offer') continue;

                // Deduplikasi: jika callId ini sudah diproses dalam 1 menit, lewati
                if (processedCalls.has(call.id)) continue;
                processedCalls.add(call.id);
                setTimeout(() => processedCalls.delete(call.id), 60000);

                // Abaikan panggilan grup
                if (call.isGroup || call.from?.endsWith('@g.us') || call.chatId?.endsWith('@g.us')) continue;

                // Identifikasi nomor telepon asli (PN) dan LID
                let phoneJid = null;
                let lidJid = null;

                if (call.callerPn) {
                    const pn = cleanNum(call.callerPn);
                    if (pn) phoneJid = `${pn}@s.whatsapp.net`;
                }

                for (const raw of [call.from, call.chatId]) {
                    if (!raw) continue;
                    if (raw.endsWith('@s.whatsapp.net')) {
                        phoneJid = phoneJid || raw;
                    } else if (raw.endsWith('@lid')) {
                        lidJid = lidJid || raw;
                    }
                }

                // Coba resolve LID jika phoneJid belum dapat
                if (!phoneJid && lidJid) {
                    const resolved = resolveLidToJid(lidJid, sock);
                    if (resolved && resolved.endsWith('@s.whatsapp.net')) {
                        phoneJid = resolved;
                    } else if (sock?.signalRepository?.lidMapping) {
                        try {
                            const pn = await sock.signalRepository.lidMapping.getPNForLID(lidJid);
                            if (pn) phoneJid = `${pn.split(':')[0].split('@')[0]}@s.whatsapp.net`;
                        } catch (e) {}
                    }
                }

                const callerPhoneNum = cleanNum(phoneJid);
                const callerLidNum = cleanNum(lidJid);
                const rawFromNum = cleanNum(call.from);

                // Pengecualian: Nomor Owner dan Nomor Bot itu sendiri
                const isExempt = call.fromMe ||
                    ownerNums.some(n => n && (n === callerPhoneNum || n === rawFromNum)) ||
                    botNum === callerPhoneNum ||
                    botNum === rawFromNum ||
                    (botLidNum && (botLidNum === callerLidNum || botLidNum === rawFromNum));

                if (isExempt) continue;

                const callType = call.isVideo ? 'Video Call' : 'Panggilan Suara';

                // 1. Tolak Panggilan Seketika (Reject Call)
                try {
                    await sock.rejectCall(call.id, call.from);
                    if (call.chatId && call.chatId !== call.from) {
                        await sock.rejectCall(call.id, call.chatId).catch(() => {});
                    }
                } catch (err) {
                    console.error('[Anti-Call] Gagal reject call:', err.message);
                }

                // 2. Langsung Blokir Nomor Tanpa Chatting
                if (phoneJid) await blockUser(sock, phoneJid, lidJid);
                if (lidJid && lidJid !== phoneJid) await blockUser(sock, lidJid, phoneJid);
                if (call.from && call.from !== phoneJid && call.from !== lidJid) await blockUser(sock, call.from);

                const displayNum = callerPhoneNum ? `+${callerPhoneNum}` : (callerLidNum ? `LID:${callerLidNum}` : (call.from || 'Unknown'));
                console.log(`[Anti-Call] 🚫 Berhasil menolak & memblokir penelpon: ${displayNum} (${callType})`);

                // 3. Kirim notifikasi ringkas ke Owner
                try {
                    const ownerTarget = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
                    const mentionJids = phoneJid ? [phoneJid] : [];
                    await sock.sendMessage(ownerTarget, {
                        text: `🛡️ *[NOTIFIKASI ANTI-CALL]*\n\n` +
                            `Penelpon otomatis ditolak & diblokir:\n` +
                            `• *Nomor:* ${callerPhoneNum ? `@${callerPhoneNum}` : displayNum}\n` +
                            `• *Tipe:* ${callType}\n` +
                            `• *Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
                            `_Nomor langsung diblokir tanpa pesan._`,
                        mentions: mentionJids
                    });
                } catch (err) {
                    // Abaikan error notifikasi owner
                }
            }
        } catch (error) {
            console.error('Anti-Call Handler Error:', error);
        }
    }
};
