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

// Pastikan inisialisasi database hanya berjalan sekali di luar loop agar tidak memanggil berkali-kali saat reconnect
let isDbConnected = false;

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

    sock.ev.on('connection.update', (update) => {
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
            console.log('✅ Bot berhasil terhubung ke WhatsApp dan siap digunakan!');
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
