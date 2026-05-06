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
