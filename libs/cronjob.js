import cron from 'node-cron';
import User from '../databases/orm/User.js';
import { Op } from 'sequelize';
import { backupDatabase } from './backup.js';

export function startCronJobs() {
    // Jalankan setiap hari pada pukul 00:00 (Reset Limit)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] ⏰ Menjalankan tugas: Reset Limit Harian...');
        try {
            // Update limit menjadi 10 HANYA untuk user yang limitnya berada di bawah 10
            const [updatedRows] = await User.update(
                { limit: 10 },
                {
                    where: {
                        limit: {
                            [Op.lt]: 10
                        }
                    }
                }
            );
            console.log(`[Cron] ✅ Berhasil mereset limit untuk ${updatedRows} user.`);
        } catch (error) {
            console.error('[Cron] ❌ Gagal mereset limit:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta' // Pastikan reset berjalan pada pukul 00.00 WIB
    });

    // Jalankan backup database setiap hari pada pukul 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] ⏰ Menjalankan tugas: Backup Database...');
        try {
            await backupDatabase();
        } catch (error) {
            console.error('[Cron] ❌ Gagal melakukan backup database:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta' // Pastikan backup berjalan pada pukul 00.00 WIB
    });

    console.log('✅ Cron Jobs berhasil diinisialisasi.');
}

