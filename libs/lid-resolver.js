import fs from 'fs';
import path from 'path';

// Cache in-memory untuk LID mapping agar tidak perlu baca disk terus-menerus
const lidCache = new Map();

/**
 * Menyelesaikan LID (Linked Device ID) ke JID nomor telepon asli.
 * Solusi dari Baileys Issue #2414.
 */
export const resolveLidToJid = (jid) => {
    if (!jid) return jid;

    // Layer 1: Jika sudah format nomor telepon standar (@s.whatsapp.net), kembalikan langsung
    if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us')) {
        return jid;
    }

    // Ekstrak angka LID
    const lidMatch = jid.match(/^(\d+)@lid$/);
    if (!lidMatch) return jid;

    const lidNumber = lidMatch[1];

    // Layer 2: Cek di cache memori
    if (lidCache.has(lidNumber)) {
        return lidCache.get(lidNumber);
    }

    // Layer 3: Mengecek mapping tersembunyi yang disimpan Baileys di folder auth (sessions)
    const sessionDir = path.join(process.cwd(), 'sessions');
    const mappingFile = path.join(sessionDir, `lid-mapping-${lidNumber}_reverse.json`);

    try {
        if (fs.existsSync(mappingFile)) {
            const phoneStr = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
            if (phoneStr) {
                const resolvedJid = `${phoneStr}@s.whatsapp.net`;
                lidCache.set(lidNumber, resolvedJid);
                return resolvedJid;
            }
        }
    } catch (err) {
        console.error('[LID Resolver] Gagal membaca mapping file:', err.message);
    }

    // Jika belum ada mapping (belum tersinkronisasi), kembalikan jid asli
    return jid;
};
