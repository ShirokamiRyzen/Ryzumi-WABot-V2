---
name: plugin-system-maintenance
description: Panduan dan tata cara penulisan struktur pembuatan (add), perbaikan/pengubahan (update/edit), penghapusan (delete) plugin, serta pemeliharaan dan pengorganisasian arsitektur sistem/desain Ryzumi-WABot V2.
---

# Plugin & System Maintenance Guidelines (Ryzumi-WABot V2)

Dokumen ini berisi standar operasional dan tata penulisan kode untuk penambahan, pembaruan, penghapusan plugin, serta pemeliharaan sistem & arsitektur Ryzumi-WABot V2.

---

## 1. Tata Penulisan & Struktur Plugin

Semua plugin disimpan di direktori `/plugins/<kategori>/<nama-plugin>.js` dan di-export sebagai ESM default object.

### Structure Template Plugin
```javascript
import config from '../../config.js';

export default {
    command: ['cmdname', 'alias1'],
    category: 'downloader', // Kategori plugin (downloader, main, owner, group, dll)
    description: 'Deskripsi singkat fungsi plugin.',
    
    // Validator Flags (Diolah otomatis oleh middleware validator.js)
    isOwner: false,       // Khusus owner/bot developer
    isGroup: false,       // Wajib di dalam grup
    isPrivate: false,     // Wajib di private chat
    isRegistered: false,  // Wajib user sudah terdaftar di DB
    isLimit: false,       // Mengurangi limit user saat digunakan
    isPremium: false,     // Khusus user status premium/VIP

    async execute(sock, m, msgData, user, group, plugins) {
        // Logika utama plugin
    }
};
```

---

## 2. Standar Operasi Plugin (Add, Edit, Delete)

### A. Add Plugin (Menambah Plugin Baru)
1. **Penamaan File & Lokasi**:
   - Tempatkan file pada folder kategori yang sesuai (`plugins/downloader/`, `plugins/tools/`, `plugins/owner/`, dll).
   - Gunakan nama file *kebab-case* (contoh: `tiktok-slide.js`, `ai-chat.js`).
2. **Penggunaan Middleware & Validator**:
   - Gunakan flag properti (`isOwner`, `isGroup`, `isPrivate`, `isRegistered`) untuk pembatasan hak akses. Jangan melakukan pengecekan manual di dalam fungsi `execute`.
3. **Penanganan Target JID & Input**:
   - Wajib gunakan helper `msgData.parseTargetJid()` untuk mendeteksi target user (baik dari mention `@user`, reply pesan, kartu kontak, atau nomor manual). Dilarang membuat regex/logika ekstraksi JID manual.
4. **Respon Persona & Kaomoji (Kawaii Anime)**:
   - Respon bot wajib menggunakan gaya bicara cewek anime yang imut, sopan, dan ceria.
   - Sertakan Kaomoji Moe Jepang (contoh: `(˶˃ ᵕ ˂˶)`, `(๑>ᴗ<๑)`, `(｡T ω T｡)`).
   - Escape backtick `\` ` jika terdapat karakter backtick di dalam template literal kaomoji atau teks pesan agar tidak terjadi `SyntaxError`.
5. **Sentralisasi Pesan & Konfigurasi**:
   - Gunakan variabel dari `config.js` untuk pesan standar/error (misal `config.RYZUMI_MSG_OWNER`, `config.RYZUMI_MSG_ERROR`).
   - Gunakan `config.API_RYZUMI` untuk endpoint API terpusat.

### B. Update / Edit Plugin (Memperbarui Plugin)
1. **Prinsip DRY (Don't Repeat Yourself)**:
   - Jika suatu logika atau fungsi pembantu (helper/utility) digunakan oleh 2 plugin atau lebih, wajib dipindahkan ke `/libs/` atau `/libs/adapter/` agar reusable.
2. **Konsistensi Signature & Parameter**:
   - Jangan merusak signature fungsi `execute(sock, m, msgData, user, group, plugins)`.
3. **Refactoring & Modifikasi Safety**:
   - Ketika mengubah alur kerja plugin, pastikan pesan error ditangani menggunakan `try...catch` dan memberikan umpan balik yang ramah pengguna.
   - Update metadata `description` atau `command` jika ada penambahan alias atau perubahan perilaku plugin.

### C. Delete Plugin (Menghapus Plugin)
1. **Pembersihan File**:
   - Hapus file plugin utama di folder `/plugins/<kategori>/<nama-plugin>.js`.
2. **Pembersihan Helper & Utility Dependencies**:
   - Periksa apakah ada helper spesifik di `/libs/` yang **hanya** dipakai oleh plugin yang dihapus. Jika tidak ada plugin lain yang menggunakan, hapus helper tersebut.
3. **Pembersihan Konfigurasi**:
   - Hapus variabel konfigurasi atau pesan khusus yang tidak lagi terpakai di `config.js` dan `.env.example`.

---

## 3. Tata Penulisan & Maintenance Sistem

### A. Middlewares (`/middlewares`)
- Logika bot handler, auth, dan validator terpisah per file (`handler.js`, `auth.js`, `validator.js`).
- Modifikasi middleware harus memastikan tidak mengganggu pipeline eksekusi plugin.

### B. Adapters & Libs (`/libs/adapter` & `/libs`)
- Pecah logika integrasi ke modul-modul kecil bertumpuk daripada satu file raksasa.
- Gunakan ES Modules (`import/export`).

### C. Database & Migrations (`/databases`)
- Semua perubahan skema database (tabel/kolom baru) WAJIB ditambahkan melalui skrip migrasi di `/databases/migrations/` dan diperbarui pada layer ORM di `/databases/orm/`.
- Dukung kompatibilitas untuk MariaDB/MySQL dan SQLite3 via `/databases/connector.js`.

### D. Konfigurasi Terpusat (`config.js`)
- Dilarang keras *hardcoding* URL API, kunci rahasia, atau pesan bot bawaan di dalam plugin.
- Semua nilai dinamis wajib didaftarkan di `config.js` atau `.env`.

### E. Code Hygiene & Verification
- Buat komentar sependek dan sesingkat mungkin; utamakan keterbacaan kode (clean code).
- Jalankan verifikasi sintaks JS menggunakan `node --check <filepath>` sebelum menyelesaikan perubahan pada sistem atau plugin.
