import { backupDatabase } from '../../libs/backup.js';
import path from 'path';
import fs from 'fs';

export default {
    command: ['backupdb', 'backup'],
    category: 'owner',
    isOwner: true,
    description: 'Melakukan backup database secara manual dan mengirimkan file SQL hasil backup',
    async execute(sock, m, msgData) {
        await sock.sendMessage(m.key.remoteJid, { text: '⏳ Sedang mencadangkan database, mohon tunggu...' }, { quoted: m });
        
        let backupPath = null;
        try {
            backupPath = await backupDatabase({ keepLocal: true });
            const fileName = path.basename(backupPath);
            const stats = fs.statSync(backupPath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            const successText = `✅ *Backup Database Berhasil!*\n\n` +
                `📁 File: \`${fileName}\`\n` +
                `⚖️ Ukuran: \`${fileSizeMB} MB\`\n` +
                `📅 Waktu: \`${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\` WIB\n\n` +
                `Mengirimkan file backup...`;
                
            await sock.sendMessage(m.key.remoteJid, { text: successText }, { quoted: m });
            
            // Send the file as document to the owner
            await sock.sendMessage(m.key.remoteJid, {
                document: fs.readFileSync(backupPath),
                mimetype: fileName.endsWith('.sqlite') ? 'application/x-sqlite3' : 'application/x-sql',
                fileName: fileName
            }, { quoted: m });
            
        } catch (error) {
            console.error('[Backup Command] Error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: `❌ *Backup Database Gagal!*\n\nError: ${error.message}` }, { quoted: m });
        } finally {
            if (backupPath && fs.existsSync(backupPath)) {
                try {
                    fs.unlinkSync(backupPath);
                    console.log(`[Backup Command] 🗑️ Cleaned up temporary local backup: ${backupPath}`);
                } catch (unlinkErr) {
                    console.error('[Backup Command] ⚠️ Failed to delete local backup file:', unlinkErr.message);
                }
            }
        }
    }
};
