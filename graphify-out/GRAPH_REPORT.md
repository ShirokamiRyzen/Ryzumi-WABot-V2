# Graph Report - Ryzumi-WABot V2  (2026-08-07)

## Corpus Check
- 95 files · ~31,387 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 304 nodes · 470 edges · 78 communities (42 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49bc4e10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- ryzumiCDN
- Ryzumi-WABot V2
- Ryzumi-WABot V2 - Agent Context & Guidelines
- package.json
- config
- dependencies
- sticker-to-media.js
- misc-ping.js
- rules/graphify.md
- workflows/graphify.md
- mime-types
- baileys
- autoAiHandler.js
- fluent-ffmpeg
- file-type
- human-readable
- jimp
- jsdom
- mariadb
- handler.js
- moment-timezone
- node-cron
- node-fetch
- node-os-utils
- node-webpmux
- nodemon
- sequelize
- sharp
- sqlite3
- syntax-error
- yargs
- yt-search
- group-close.js
- group-desc.js
- group-get-invite.js
- group-lock.js
- group-open.js
- group-rename.js
- group-reset-invite.js
- group-unlock.js
- 3. Tata Penulisan & Maintenance Sistem
- messageAdapter.js
- downloader-mega.js
- owner-eval.js
- cheerio
- backup.js
- dotenv

## God Nodes (most connected - your core abstractions)
1. `config` - 46 edges
2. `Group` - 11 edges
3. `resolveLidToJid()` - 11 edges
4. `ryzumiCDN()` - 11 edges
5. `User` - 10 edges
6. `connectToWhatsApp()` - 10 edges
7. `processAuth()` - 10 edges
8. `Setting` - 9 edges
9. `extractMessageData()` - 9 edges
10. `Ryzumi-WABot V2 - Agent Context & Guidelines` - 9 edges

## Surprising Connections (you probably didn't know these)
- `onParticipantsUpdate()` --references--> `Group`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/Group.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `onParticipantsUpdate()` --references--> `User`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/User.js
- `connectToWhatsApp()` --calls--> `extractMessageData()`  [EXTRACTED]
  index.js → libs/adapter/messageAdapter.js
- `botHandler()` --calls--> `handleAutoAi()`  [EXTRACTED]
  middlewares/handler.js → libs/autoAiHandler.js

## Import Cycles
- None detected.

## Communities (78 total, 36 thin omitted)

### Community 1 - "index.js"
Cohesion: 0.19
Nodes (16): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), logMessage(), startCronJobs() (+8 more)

### Community 2 - "ryzumiCDN"
Cohesion: 0.22
Nodes (12): imageToWebp(), tmpDir, videoToWebp(), writeExif(), ryzumiCDN(), execute(), execute(), execute() (+4 more)

### Community 3 - "Ryzumi-WABot V2"
Cohesion: 0.15
Nodes (12): 💾 Backup Database Otomatis & Sinkronisasi Nextcloud, 🚀 Cara Install & Setup, Cara Konfigurasi (di `.env`):, 🛠️ Cara Menambah Fitur / Plugin Baru, Fitur Utama, Fitur Utama Backup:, 📝 Lisensi, Penjelasan Variabel Eksekusi: (+4 more)

### Community 4 - "Ryzumi-WABot V2 - Agent Context & Guidelines"
Cohesion: 0.18
Nodes (10): Database, Handler & Adapter, Ketentuan Teknis & Refactoring, Konfigurasi, Overview, Panduan Penulisan Kode, Ryzumi-WABot V2 - Agent Context & Guidelines, Server & Websocket (+2 more)

### Community 5 - "package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, scripts, dev, start (+2 more)

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, chalk, dependencies, axios, chalk, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "autoAiHandler.js"
Cohesion: 0.52
Nodes (4): FORBIDDEN_COMMANDS, handleAutoAi(), validatePlugin(), execute()

### Community 21 - "handler.js"
Cohesion: 0.60
Nodes (4): loadPlugins(), plugins, watchPlugins(), pluginDir

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

### Community 56 - "messageAdapter.js"
Cohesion: 0.25
Nodes (11): extractMessageData(), getMessageContent(), getMessageType(), unwrapMessage(), getPP(), sendAlbumMessage(), lidCache, resolveLidToJid() (+3 more)

### Community 63 - "backup.js"
Cohesion: 0.60
Nodes (4): backupDatabase(), pruneOldBackups(), uploadToNextcloud(), execute()

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config` to `ai-tencent.js`, `index.js`, `ryzumiCDN`, `autoAiHandler.js`, `handler.js`, `messageAdapter.js`, `downloader-mega.js`, `owner-eval.js`, `config.js`, `downloader-facebook.js`, `downloader-instagram.js`, `backup.js`, `downloader-all-in-one.js`, `downloader-twitter.js`, `downloader-danbooru.js`, `downloader-ytmp4.js`, `downloader-ytmp3.js`, `search-pinterest.js`, `search-pixiv.js`, `search-lyrics.js`, `tool-cek-pln.js`, `tool-cek-resi.js`, `tool-cek-bapenda-jabar.js`, `tool-read-viewonce.js`, `tool-ssweb.js`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `baileys`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `cheerio`, `dotenv`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._