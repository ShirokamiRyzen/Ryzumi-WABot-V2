import fs from 'fs';
import path from 'path';

// Array utama untuk menyimpan plugin yang di-load
export const plugins = [];

let isReloading = false;

// Fungsi untuk me-load ulang seluruh plugin secara atomic
export const loadPlugins = async (dir) => {
    const tempPlugins = [];

    const readDirRecursively = async (currentDir) => {
        if (!fs.existsSync(currentDir)) return;
        const files = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(currentDir, file.name);
            if (file.isDirectory()) {
                await readDirRecursively(fullPath);
            } else if (file.name.endsWith('.js')) {
                try {
                    // Tambahkan query parameter Date.now() untuk by-pass sistem cache ESM
                    const module = await import(`file://${fullPath}?update=${Date.now()}`);
                    if (module.default) {
                        tempPlugins.push(module.default);
                    }
                } catch (err) {
                    console.error(`[Hot-Reload] Gagal memuat plugin: ${file.name}`, err.message);
                }
            }
        }
    };

    await readDirRecursively(dir);
    
    // Swap array secara atomic agar tidak ada kondisi plugins kosong saat sedang loading
    plugins.length = 0;
    plugins.push(...tempPlugins);

    console.log(`[Hot-Reload] ✅ Berhasil memuat ulang ${plugins.length} plugins.`);
};

// Fungsi untuk me-watch file menggunakan fs.watch
export const watchPlugins = (dir) => {
    console.log(`[Hot-Reload] 👀 Memantau perubahan di folder plugins...`);

    // Recursive watch tidak selalu didukung sempurna di OS lama, tapi bekerja baik di Windows/macOS
    fs.watch(dir, { recursive: true }, async (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;

        // Cegah reload berkali-kali dalam waktu bersamaan (Debounce)
        if (isReloading) return;
        isReloading = true;

        console.log(`[Hot-Reload] 🔄 Perubahan terdeteksi pada file: ${filename}`);
        await loadPlugins(dir);

        // Reset debounce delay
        setTimeout(() => {
            isReloading = false;
        }, 1000);
    });
};
