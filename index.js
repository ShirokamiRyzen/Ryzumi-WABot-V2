import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import chalk from 'chalk';
import pino from 'pino';
import config from './config.js';
import sequelize from './databases/connector.js';
import qrcode from 'qrcode-terminal';
import botHandler from './middlewares/handler.js';
import { extractMessageData } from './libs/adapter/messageAdapter.js';
import { logMessage } from './libs/console.js';
import fs from 'fs';
import { startCronJobs } from './libs/cronjob.js';
import Group from './databases/orm/Group.js';
import { setGroupMetadata } from './libs/groupCache.js';

// Pastikan inisialisasi database hanya berjalan sekali di luar loop agar tidak memanggil berkali-kali saat reconnect
let isDbConnected = false;

/**
 * Sinkronisasi semua grup yang diikuti bot ke database secara otomatis.
 * Menggunakan groupFetchAllParticipating untuk menghindari spam request (rate limit).
 */
async function syncGroups(sock) {
    try {
        console.log('⏳ Sedang menyinkronkan data grup ke database...');
        const groups = await sock.groupFetchAllParticipating();
        const groupJids = Object.keys(groups);
        
        // Populasikan cache segera agar middleware bisa langsung menggunakan data yang ada
        for (const jid of groupJids) {
            setGroupMetadata(jid, groups[jid]);
        }

        let newGroups = 0;
        let updatedGroups = 0;

        for (const jid of groupJids) {
            const groupData = groups[jid];
            const [group, created] = await Group.findOrCreate({
                where: { jid: jid },
                defaults: { 
                    name: groupData.subject,
                    is_welcome: false,
                    is_ban: false
                }
            });

            if (created) {
                newGroups++;
            } else if (group.name !== groupData.subject) {
                await group.update({ name: groupData.subject });
                updatedGroups++;
            }
        }
        
        if (newGroups > 0 || updatedGroups > 0) {
            console.log(`✅ Sinkronisasi grup selesai! (${newGroups} baru, ${updatedGroups} diperbarui)`);
        } else {
            console.log('✅ Data grup sudah sesuai dengan database.');
        }
    } catch (e) {
        console.error('❌ Gagal sinkronisasi grup:', e.message);
    }
}

async function connectToWhatsApp() {
    // Mengecek dan melakukan sinkronisasi database (Auto Migrate layaknya Laravel)
    if (!isDbConnected) {
        try {
            await sequelize.authenticate();
            console.log('✅ Database terhubung!');
            
            await sequelize.sync({ alter: true });
            console.log('✅ Database berhasil di-synchronize (Migrations selesai).');
            isDbConnected = true;
            
            // Inisialisasi jadwal Cron (Reset limit harian dll)
            startCronJobs();
        } catch (error) {
            console.error('❌ Gagal menghubungkan ke database:', error.message);
            return;
        }
    }

    // Fetch and use the latest WhatsApp Web version from Baileys
    const { version: waVersion, isLatest } = await fetchLatestBaileysVersion().catch(err => {
        console.error('Failed to fetch latest Baileys version:', err);
        return { version: undefined, isLatest: false };
    });

    if (waVersion) {
        const verStr = waVersion.join('.');
        console.log(chalk.cyan(`Using WhatsApp Web version: v${verStr} (${isLatest ? 'latest' : 'not latest'})`));
    }

    // Konfigurasi Session
    const { state, saveCreds } = await useMultiFileAuthState('sessions');

    // Koneksi Baileys
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        version: waVersion,
        browser: ["macOS", "Safari", "20.0.00"] // Mencegah koneksi langsung ditolak (loop) oleh WA
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Menampilkan QR
        if (qr) {
            console.log('\nScan QR Code ini menggunakan WhatsApp Anda:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode;
            console.log(`Koneksi terputus. Alasan: ${reason}`);
            
            if (reason === DisconnectReason.loggedOut) {
                console.log('Sesi telah kedaluwarsa atau dilogout. Menghapus session...');
                if (fs.existsSync('sessions')) {
                    fs.rmSync('sessions', { recursive: true, force: true });
                }
                setTimeout(connectToWhatsApp, 2000);
            } else {
                console.log('Mencoba menyambungkan kembali...');
                setTimeout(connectToWhatsApp, 2000);
            }
        } else if (connection === 'open') {
            console.log('✅ Bot berhasil terhubung ke WhatsApp! Sedang menyinkronkan data...');
            
            // Tunggu sinkronisasi awal maksimal 3 detik agar cache terisi sebelum melayani pesan
            const syncPromise = syncGroups(sock);
            await Promise.race([
                syncPromise, 
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            
            console.log('✅ Bot siap digunakan!');
        }
    });

    // Event Handler Pesan Masuk via Middleware
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const m of messages) {
            if (!m.message) continue;

            // Abaikan pesan sistem/dummy messageContextInfo atau senderKeyDistributionMessage agar tidak membebani log
            const msgData = extractMessageData(m, sock);
            
            // Abaikan pesan sistem/metadata/protokol agar tidak mengganggu log dan eksekusi
            const protocolTypes = ['messageContextInfo', 'senderKeyDistributionMessage', 'protocolMessage', 'peerDataOperationRequestMessage'];
            if (protocolTypes.includes(msgData.messageType)) continue;

            // Jika pesan berasal dari bot sendiri (balasan atau owner ngetik dari nomor bot)
            if (m.key.fromMe) {
                logMessage(sock, msgData);
                
                // Jika bot ngetik command sendiri, biarkan lanjut ke handler
                if (!msgData.commandName) continue;
            } else {
                logMessage(sock, msgData);
            }

            // Limpahkan pesan masuk ke handler
            await botHandler(sock, m, msgData);
        }
    });

    // Deteksi Grup Baru secara Real-time
    sock.ev.on('groups.upsert', async (groups) => {
        for (const group of groups) {
            try {
                const [record, created] = await Group.findOrCreate({
                    where: { jid: group.id },
                    defaults: { 
                        name: group.subject,
                        is_welcome: false,
                        is_ban: false
                    }
                });
                if (created) {
                    console.log(`✨ Terdeteksi masuk ke grup baru: ${group.subject} (${group.id}) - Berhasil didaftarkan ke database.`);
                }
                
                // Update Cache Metadata
                const metadata = await sock.groupMetadata(group.id);
                setGroupMetadata(group.id, metadata);
            } catch (e) {
                console.error('❌ Gagal mendaftarkan grup baru dari upsert:', e.message);
            }
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        const { plugins } = await import('./libs/hot-reload.js');
        for (const plugin of plugins) {
            if (plugin.onParticipantsUpdate) {
                await plugin.onParticipantsUpdate(sock, update);
            }
        }
    });
}

connectToWhatsApp();
