import Setting from '../../databases/orm/Setting.js';
import config from '../../config.js';
import { resolveLidToJid, lidCache } from '../../libs/lid-resolver.js';
import groupCache from '../../libs/groupCache.js';

// Cache untuk deduplikasi event call agar tidak diproses berulang-ulang
const processedCalls = new Set();

/**
 * Menyelesaikan (resolve) LID dan JID nomor telepon secara komprehensif
 */
async function resolveCallerIdentity(rawJid, sock, call) {
    let phoneJid = null;
    let lidJid = null;

    // 1. Ambil nomor telepon langsung dari atribut panggilan WhatsApp jika ada
    if (call?.callerPn) {
        const clean = call.callerPn.replace(/[^0-9]/g, '');
        if (clean) phoneJid = `${clean}@s.whatsapp.net`;
    }

    if (rawJid?.endsWith('@s.whatsapp.net')) {
        phoneJid = phoneJid || rawJid;
    } else if (rawJid?.endsWith('@lid')) {
        lidJid = rawJid;
    }

    if (call?.chatId?.endsWith('@s.whatsapp.net')) {
        phoneJid = phoneJid || call.chatId;
    } else if (call?.chatId?.endsWith('@lid')) {
        lidJid = lidJid || call.chatId;
    }

    const lidNumber = lidJid ? lidJid.split('@')[0] : null;

    // 2. Cek memori lidCache & reverse mapping session Baileys
    if (lidJid && !phoneJid) {
        const resolved = resolveLidToJid(lidJid, sock);
        if (resolved && resolved.endsWith('@s.whatsapp.net')) {
            phoneJid = resolved;
        }
    }

    // 3. Cek Baileys signalRepository lidMapping
    if (lidJid && !phoneJid && sock?.signalRepository?.lidMapping) {
        try {
            const pn = await sock.signalRepository.lidMapping.getPNForLID(lidJid);
            if (pn) {
                const cleanPn = pn.split(':')[0].split('@')[0];
                phoneJid = `${cleanPn}@s.whatsapp.net`;
            }
        } catch (e) {}
    }

    // 4. Cari dari seluruh metadata grup yang diikuti bot
    if (lidJid && !phoneJid) {
        for (const [_, metadata] of groupCache) {
            if (!metadata?.participants) continue;
            const match = metadata.participants.find(p => 
                p.lid === lidJid || 
                p.id === lidJid || 
                (lidNumber && p.lid && p.lid.split('@')[0] === lidNumber)
            );
            if (match && match.id && match.id.endsWith('@s.whatsapp.net')) {
                phoneJid = match.id;
                break;
            }
        }
    }

    // 5. Daftarkan mapping ke memory cache agar Baileys mengenali nomor ini
    if (phoneJid && lidJid) {
        const pnUser = phoneJid.split('@')[0].split(':')[0];
        const lidUser = lidJid.split('@')[0].split(':')[0];
        lidCache.set(lidUser, phoneJid);
        if (sock?.signalRepository?.lidMapping) {
            try {
                sock.signalRepository.lidMapping.mappingCache.set(`lid:${lidUser}`, pnUser);
                sock.signalRepository.lidMapping.mappingCache.set(`pn:${pnUser}`, lidUser);
            } catch (e) {}
        }
    }

    return { phoneJid, lidJid, rawJid };
}

/**
 * Memblokir nomor pengguna secara tuntas (baik JID maupun LID)
 */
async function executeBlock(sock, { phoneJid, lidJid, rawJid }) {
    const pnUser = phoneJid ? phoneJid.split('@')[0].split(':')[0] : null;
    const lidUser = lidJid ? lidJid.split('@')[0].split(':')[0] : null;

    if (pnUser && lidUser && sock?.signalRepository?.lidMapping) {
        try {
            sock.signalRepository.lidMapping.mappingCache.set(`lid:${lidUser}`, pnUser);
            sock.signalRepository.lidMapping.mappingCache.set(`pn:${pnUser}`, lidUser);
        } catch (e) {}
    }

    const targets = [phoneJid, lidJid, rawJid].filter(Boolean);
    let isBlocked = false;

    // 1. Coba updateBlockStatus standar Baileys
    for (const target of targets) {
        try {
            await sock.updateBlockStatus(target, 'block');
            isBlocked = true;
        } catch (err) {
            // Lanjut ke fallback raw query jika Baileys internal mapping gagal
        }
    }

    // 2. Fallback kirim stanza IQ Blocklist langsung ke server WhatsApp
    if (!isBlocked) {
        for (const target of targets) {
            try {
                const itemAttrs = { action: 'block', jid: target };
                if (target.endsWith('@lid') && phoneJid) {
                    itemAttrs.pn_jid = phoneJid;
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
                isBlocked = true;
            } catch (err) {
                // Abaikan
            }
        }
    }

    return isBlocked;
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
                // Hanya proses status 'offer' (panggilan baru masuk)
                if (call.status !== 'offer') continue;

                // Deduplikasi event
                if (processedCalls.has(call.id)) continue;
                processedCalls.add(call.id);
                setTimeout(() => processedCalls.delete(call.id), 60000);

                // Abaikan panggilan grup
                if (call.isGroup || call.from?.endsWith('@g.us') || call.chatId?.endsWith('@g.us')) continue;

                // Resolusi JID nomor telepon & LID secara lengkap
                const { phoneJid, lidJid, rawJid } = await resolveCallerIdentity(call.from, sock, call);

                const callerPhoneNum = cleanNum(phoneJid);
                const callerLidNum = cleanNum(lidJid);
                const rawFromNum = cleanNum(rawJid);

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

                // 2. Blokir Nomor Penelpon Secara Tuntas (Tanpa kirim chat apapun)
                await executeBlock(sock, { phoneJid, lidJid, rawJid });

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
                            `_Panggilan langsung di-reject dan diblokir._`,
                        mentions: mentionJids
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
