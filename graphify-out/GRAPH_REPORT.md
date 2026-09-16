# Graph Report - Ryzumi-WABot V2  (2026-09-16)

## Corpus Check
- 109 files · ~36,945 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 355 nodes · 616 edges · 76 communities (39 shown, 37 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d39b90a6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- messageAdapter.js
- ryzumiCDN
- Ryzumi-WABot V2
- Ryzumi-WABot V2 - Agent Context & Guidelines
- package.json
- dependencies
- sticker-to-media.js
- misc-ping.js
- rules/graphify.md
- workflows/graphify.md
- mime-types
- chalk
- aiModels.js
- fluent-ffmpeg
- file-type
- human-readable
- jimp
- jsdom
- mariadb
- moment-timezone
- config
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
- dotenv
- group-welcome-leave.js
- downloader-mega.js
- owner-eval.js
- cheerio

## God Nodes (most connected - your core abstractions)
1. `config` - 43 edges
2. `executeAiRequest()` - 34 edges
3. `handleAutoAi()` - 18 edges
4. `resolveLidToJid()` - 15 edges
5. `Setting` - 12 edges
6. `Group` - 11 edges
7. `ryzumiCDN()` - 11 edges
8. `User` - 10 edges
9. `connectToWhatsApp()` - 10 edges
10. `processAuth()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `onParticipantsUpdate()` --references--> `Group`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/Group.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/owner/owner-anticall.js → databases/orm/Setting.js
- `onCall()` --references--> `Setting`  [EXTRACTED]
  plugins/owner/owner-anticall.js → databases/orm/Setting.js
- `onParticipantsUpdate()` --references--> `User`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/User.js

## Import Cycles
- None detected.

## Communities (76 total, 37 thin omitted)

### Community 0 - "index.js"
Cohesion: 0.15
Nodes (19): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), backupDatabase(), pruneOldBackups() (+11 more)

### Community 1 - "messageAdapter.js"
Cohesion: 0.19
Nodes (14): extractMessageData(), getMessageContent(), getMessageType(), unwrapMessage(), sendAlbumMessage(), groupCache, lidCache, resolveLidToJid() (+6 more)

### Community 2 - "ryzumiCDN"
Cohesion: 0.26
Nodes (12): formatStickerAuthor(), imageToWebp(), tmpDir, videoToWebp(), writeExif(), ryzumiCDN(), execute(), execute() (+4 more)

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
Nodes (7): axios, baileys, dependencies, axios, baileys, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "aiModels.js"
Cohesion: 0.07
Nodes (44): AI_WEB_TOOLS, executeAiRequest(), executeAiTool(), fetchOpenAiModels(), getBrandRegex(), getQuoteOption(), getTextModels(), getVisionModels() (+36 more)

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `SESSIONS_DIR`, `tmpDir`, `pluginDir`, `name` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config` to `index.js`, `messageAdapter.js`, `ryzumiCDN`, `config.js`, `aiModels.js`, `group-welcome-leave.js`, `downloader-mega.js`, `owner-eval.js`, `downloader-douyin.js`, `downloader-instagram.js`, `downloader-krakenfiles.js`, `downloader-mediafire.js`, `downloader-pinterest.js`, `downloader-pixiv.js`, `downloader-threads.js`, `main-menu.js`, `search-lyrics.js`, `search-pddikti.js`, `search-pixiv.js`, `tool-alight-activator.js`, `tool-cek-pln.js`, `tool-cek-resi.js`, `tool-ssweb.js`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `chalk`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `dotenv`, `cheerio`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `startTime`, `SESSIONS_DIR`, `tmpDir` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `aiModels.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07226107226107226 - nodes in this community are weakly interconnected._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._