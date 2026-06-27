import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sequelize from '../databases/connector.js';
import config from '../config.js';

/**
 * Uploads a file to Nextcloud via WebDAV PUT.
 * 
 * @param {string} filePath 
 */
async function uploadToNextcloud(filePath) {
    const fileName = path.basename(filePath);
    let webdavPath = config.NEXTCLOUD_PATH || '';
    if (webdavPath && !webdavPath.startsWith('/')) {
        webdavPath = '/' + webdavPath;
    }
    if (webdavPath && !webdavPath.endsWith('/')) {
        webdavPath = webdavPath + '/';
    }

    const authHeader = 'Basic ' + Buffer.from(`${config.NEXTCLOUD_USER}:${config.NEXTCLOUD_PASSWORD}`).toString('base64');
    const baseUrl = `${config.NEXTCLOUD_URL.replace(/\/$/, '')}/remote.php/dav/files/${config.NEXTCLOUD_USER}`;
    const folderUrl = `${baseUrl}${webdavPath.replace(/\/$/, '')}`;

    // Create folder using MKCOL if it doesn't exist
    try {
        await axios({
            method: 'MKCOL',
            url: folderUrl,
            headers: {
                'Authorization': authHeader
            }
        });
        console.log(`[Nextcloud] Folder created or verified: ${folderUrl}`);
    } catch (err) {
        if (err.response && err.response.status === 405) {
            // Folder already exists
        } else {
            console.warn(`[Nextcloud] MKCOL folder creation status: ${err.response ? err.response.status : err.message}`);
        }
    }

    // Read file and upload
    const fileContent = await fs.readFile(filePath);
    const uploadUrl = `${baseUrl}${webdavPath}${fileName}`;

    console.log(`[Nextcloud] Uploading ${fileName} to Nextcloud...`);
    await axios.put(uploadUrl, fileContent, {
        headers: {
            'Authorization': authHeader,
            'Content-Type': fileName.endsWith('.sqlite') ? 'application/x-sqlite3' : 'application/x-sql'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });
}

/**
 * Perform an automated backup of the database (MariaDB/MySQL/SQLite).
 * Runs natively in Node.js without relying on the external mysqldump CLI.
 * 
 * @param {object} options
 * @param {boolean} options.keepLocal Keep local file even after uploading to Nextcloud (default: false)
 * @returns {Promise<string>} The path to the created backup file (if kept) or a success message.
 */
export async function backupDatabase(options = {}) {
    const keepLocal = options.keepLocal ?? false;
    let backupPath = '';

    try {
        console.log('[Backup] ⏳ Starting database backup...');
        const dialect = sequelize.getDialect();
        const backupDir = path.resolve('./databases/backups');
        await fs.mkdir(backupDir, { recursive: true });

        // Handle SQLite (copy sqlite file directly)
        if (dialect === 'sqlite') {
            const sqlitePath = path.resolve('./databases/ryzumi_wa.sqlite');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            backupPath = path.join(backupDir, `backup-sqlite-${timestamp}.sqlite`);
            
            await fs.copyFile(sqlitePath, backupPath);
            console.log(`[Backup] ✅ SQLite backup created locally: ${backupPath}`);
        } else {
            // Handle MySQL / MariaDB (native node query-based dump)
            const dbName = sequelize.config.database;
            const tables = await sequelize.query('SHOW TABLES', {
                type: sequelize.QueryTypes.SELECT,
                raw: true
            });
            
            let sqlDump = '';
            sqlDump += `-- Database Backup for ${dbName}\n`;
            sqlDump += `-- Date: ${new Date().toISOString()}\n\n`;
            sqlDump += `/*!40101 SET NAMES utf8mb4 */;\n`;
            sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

            for (const tableObj of tables) {
                const tableName = Object.values(tableObj)[0];
                
                // Get CREATE TABLE
                const createTableResult = await sequelize.query(`SHOW CREATE TABLE \`${tableName}\``, {
                    type: sequelize.QueryTypes.SELECT,
                    raw: true
                });
                const createTableSql = createTableResult[0]['Create Table'] || createTableResult[0]['Create View'];
                
                sqlDump += `-- ------------------------------------------------------\n`;
                sqlDump += `-- Table structure for table \`${tableName}\`\n`;
                sqlDump += `-- ------------------------------------------------------\n`;
                sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                sqlDump += `${createTableSql};\n\n`;

                // Get Table Data
                const rows = await sequelize.query(`SELECT * FROM \`${tableName}\``, {
                    type: sequelize.QueryTypes.SELECT,
                    raw: true
                });

                if (rows.length > 0) {
                    sqlDump += `-- ------------------------------------------------------\n`;
                    sqlDump += `-- Data for table \`${tableName}\`\n`;
                    sqlDump += `-- ------------------------------------------------------\n`;
                    
                    const chunkSize = 100;
                    for (let i = 0; i < rows.length; i += chunkSize) {
                        const chunk = rows.slice(i, i + chunkSize);
                        const columns = Object.keys(chunk[0]).map(col => `\`${col}\``).join(', ');
                        
                        const valuesList = chunk.map(row => {
                            const vals = Object.values(row).map(val => sequelize.escape(val)).join(', ');
                            return `(${vals})`;
                        }).join(',\n');
                        
                        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES \n${valuesList};\n`;
                    }
                    sqlDump += `\n`;
                }
            }
            
            sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

            // Generate filename
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + 
                String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                String(now.getDate()).padStart(2, '0');
            const timeStr = String(now.getHours()).padStart(2, '0') + '-' + 
                String(now.getMinutes()).padStart(2, '0') + '-' + 
                String(now.getSeconds()).padStart(2, '0');
                
            backupPath = path.join(backupDir, `backup-${dbName}-${dateStr}_${timeStr}.sql`);
            
            await fs.writeFile(backupPath, sqlDump, 'utf8');
            console.log(`[Backup] ✅ Database backup created locally: ${backupPath}`);
        }

        // Upload to Nextcloud if configured
        if (config.NEXTCLOUD_URL && config.NEXTCLOUD_USER && config.NEXTCLOUD_PASSWORD) {
            try {
                await uploadToNextcloud(backupPath);
                console.log('[Backup] ✅ Database backup uploaded to Nextcloud successfully.');
                
                // Automatically delete local file if keepLocal is false
                if (!keepLocal) {
                    await fs.unlink(backupPath);
                    console.log(`[Backup] 🗑️ Local backup file deleted: ${backupPath}`);
                    return 'Uploaded to Nextcloud & local file cleaned up.';
                }
            } catch (uploadError) {
                console.error('[Backup] ❌ Upload to Nextcloud failed:', uploadError);
                // Keep local file as fallback if upload failed
                console.log('[Backup] ⚠️ Keeping local backup file due to upload failure.');
            }
        } else {
            console.log('[Backup] ⚠️ Nextcloud config not complete. Keeping local file.');
        }

        // Clean up old backups (only relevant if keeping local files)
        if (keepLocal) {
            await pruneOldBackups(backupDir);
        }

        return backupPath;
    } catch (error) {
        console.error('[Backup] ❌ Database backup failed:', error);
        throw error;
    }
}

/**
 * Deletes older backup files keeping only the 30 most recent ones.
 * 
 * @param {string} backupDir 
 */
async function pruneOldBackups(backupDir) {
    try {
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(file => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sqlite')));
        
        if (backupFiles.length <= 30) return;
        
        const filesWithStats = [];
        for (const file of backupFiles) {
            const filePath = path.join(backupDir, file);
            const stat = await fs.stat(filePath);
            filesWithStats.push({ path: filePath, mtime: stat.mtimeMs });
        }
        
        filesWithStats.sort((a, b) => b.mtime - a.mtime);
        
        const filesToDelete = filesWithStats.slice(30);
        for (const file of filesToDelete) {
            await fs.unlink(file.path);
            console.log(`[Backup] 🗑️ Pruned old backup file: ${path.basename(file.path)}`);
        }
    } catch (err) {
        console.warn('[Backup] ⚠️ Failed to prune old backups:', err.message);
    }
}
