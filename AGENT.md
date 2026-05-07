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
- **Hindari Emoji**: Jangan pernah menggunakan emoji di dalam pesan (teks), string, atau komponen UI lainnya di dalam plugins. Gunakan teks atau simbol standar jika diperlukan.
