# Ryzumi-WABot V2 - Agent Context & Guidelines

## Overview
Project ini menggunakan [Whiskeysocket Baileys](https://baileys.wiki/docs) untuk berinteraksi dengan WhatsApp API.

## Struktur Folder
Proyek ini menggunakan arsitektur berbasis *plugin* untuk fitur-fiturnya. Semua plugin/fitur diletakkan di dalam folder `/plugins/` dan dikelompokkan berdasarkan kategori.

Contoh struktur:
- `/plugins/downloaders/`
  - `facebook.js`
  - `instagram.js`
- `/plugins/main/`
  - `menu.js`
  - `ping.js`
- `/plugins/account/`
  - `register.js`
  - `unregister.js`
  - `profile.js`
- *(Kategori lainnya mengikuti format yang sama)*

### Handler & Adapter
- **/middlewares**: Digunakan untuk *bot handler*.
- **/libs/adapter**: Menyimpan berbagai adapter seperti *action adapter*, *event adapter*, *message adapter*, dll.

## Server & Websocket
- Implementasi *websocket* dan *HTTP server* menggunakan framework **Express** dan dijalankan melalui file `server.js`.

## Session & Autentikasi
- **Folder Session Utama**: `/sessions`
- **File Session Detail**: File `ryzumi-sesion.json` diletakkan di *root* direktori `/`.

## Database
Sistem database mendukung dua tipe driver: **MariaDB/MySQL** dan **SQLite3**.
- **Koneksi Database**: Dikelola melalui file `/databases/connector.js`.
- **Migrations Database**: Terletak di direktori `/databases/migrations`.
- **ORM (Object-Relational Mapping)**: Terletak di direktori `/databases/orm`.

## Konfigurasi
Seluruh konfigurasi proyek (baik itu nomor bot, nama bot, database, hingga pesan error/respons) didefinisikan secara terpusat di dalam `config.js` di root direktori proyek.

## Panduan Penulisan Kode
- **Kerapihan Kode**: Tulis kode dengan rapi, terstruktur, dan selalu utamakan keterbacaan (readability) sesuai dengan standar penulisan JavaScript/Node.js.
- **Komentar Singkat**: Reduksi penggunaan komentar di dalam kode. Buat komentar sependek dan sesingkat mungkin, dan hanya tambahkan pada bagian yang benar-benar esensial atau kompleks.
- **Middleware & Adapter Terpisah**: Pecah logika middleware dan adapter menjadi file/modul yang lebih kecil (jangan hanya bertumpuk pada satu file handler/adapter). Tujuannya agar file tidak terlalu panjang dan lebih mudah di-maintain.
- **Konsep DRY pada Plugin**: Gunakan prinsip DRY (Don't Repeat Yourself) pada pembuatan plugin. Standarisasi dan ekstrak fungsionalitas yang sering digunakan ke dalam helper atau utility tersendiri agar tidak perlu menulis fungsi yang sama berkali-kali.
- **Cute Anime Persona**: Semua pesan respon dari bot (teks) wajib menggunakan gaya bicara cewek anime yang imut (kawaii), sopan, dan ceria. Gunakan akhiran seperti "~", "uwooo", "kakak~", dll.
- **Wajib Kaomoji**: Gunakan emoticon Jepang (kaomoji) yang lucu dan Moe (seperti (˶˃ ᵕ ˂˶), (๑>ᴗ<๑), (╥﹏╥), dll) di setiap pesan. Hindari penggunaan emoji HP standar agar kesan anime lebih terasa.

## Ketentuan Teknis & Refactoring
- **Syntax Safety**: Saat menulis pesan di dalam *template literal* (backticks), pastikan untuk selalu meng-escape karakter backtick ( \` ) jika ada di dalam kaomoji atau teks pesan agar tidak terjadi *syntax error*.
- **Sentralisasi Pesan**: Gunakan variabel pesan dari `config.js` (seperti `config.RYZUMI_MSG_OWNER`, `config.RYZUMI_MSG_QUOTED`, dll) untuk respon standar. Hindari menulis ulang pesan (hardcoded) yang sudah didefinisikan di `.env`/`config.js`.
- **Gunakan Message Helper**: Selalu gunakan `msgData.parseTargetJid()` untuk mengambil JID target (baik dari tag, reply pesan, kartu kontak/vcard, maupun input nomor manual). Dilarang menulis ulang logika deteksi JID di dalam plugin.
- **Validasi Plugin**: Manfaatkan properti objek plugin seperti `isPrivate: true`, `isGroup: true`, atau `isRegistered: true` agar pengecekan dilakukan secara otomatis oleh middleware `validator.js`. Jangan melakukan pengecekan manual di dalam fungsi `execute` jika sudah tersedia di properti plugin.
- **API Service**: Gunakan base URL `config.API_RYZUMI` untuk semua integrasi API Ryzumi.
- **REUSE Logic**: Jika ada fungsi yang digunakan oleh lebih dari dua plugin, wajib dipindahkan ke `/libs/` atau `/libs/adapter/` agar bisa di-import dan digunakan kembali.

