# Graph Report - Ryzumi-WABot V2  (2026-08-09)

## Corpus Check
- 98 files · ~32,333 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 311 nodes · 504 edges · 58 communities (24 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2db51e3b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- messageAdapter.js
- index.js
- ryzumiCDN
- Ryzumi-WABot V2
- Ryzumi-WABot V2 - Agent Context & Guidelines
- package.json
- config.js
- dependencies
- sticker-to-media.js
- misc-ping.js
- rules/graphify.md
- workflows/graphify.md
- mime-types
- chalk
- handler.js
- fluent-ffmpeg
- file-type
- human-readable
- jimp
- jsdom
- mariadb
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
- downloader-mega.js
- cheerio
- dotenv

## God Nodes (most connected - your core abstractions)
1. `config` - 48 edges
2. `cleanAiResponse()` - 17 edges
3. `Group` - 11 edges
4. `resolveLidToJid()` - 11 edges
5. `ryzumiCDN()` - 11 edges
6. `User` - 10 edges
7. `connectToWhatsApp()` - 10 edges
8. `processAuth()` - 10 edges
9. `Setting` - 9 edges
10. `extractMessageData()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `onParticipantsUpdate()` --references--> `Group`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/Group.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `onParticipantsUpdate()` --references--> `User`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/User.js
- `connectToWhatsApp()` --calls--> `extractMessageData()`  [EXTRACTED]
  index.js → libs/adapter/messageAdapter.js
- `connectToWhatsApp()` --calls--> `botHandler()`  [EXTRACTED]
  index.js → middlewares/handler.js

## Import Cycles
- None detected.

## Communities (58 total, 34 thin omitted)

### Community 0 - "messageAdapter.js"
Cohesion: 0.25
Nodes (11): extractMessageData(), getMessageContent(), getMessageType(), unwrapMessage(), getPP(), sendAlbumMessage(), lidCache, resolveLidToJid() (+3 more)

### Community 1 - "index.js"
Cohesion: 0.15
Nodes (19): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), backupDatabase(), pruneOldBackups() (+11 more)

### Community 2 - "ryzumiCDN"
Cohesion: 0.25
Nodes (11): imageToWebp(), tmpDir, videoToWebp(), writeExif(), ryzumiCDN(), execute(), execute(), execute() (+3 more)

### Community 3 - "Ryzumi-WABot V2"
Cohesion: 0.15
Nodes (12): 💾 Backup Database Otomatis & Sinkronisasi Nextcloud, 🚀 Cara Install & Setup, Cara Konfigurasi (di `.env`):, 🛠️ Cara Menambah Fitur / Plugin Baru, Fitur Utama, Fitur Utama Backup:, 📝 Lisensi, Penjelasan Variabel Eksekusi: (+4 more)

### Community 4 - "Ryzumi-WABot V2 - Agent Context & Guidelines"
Cohesion: 0.18
Nodes (10): Database, Handler & Adapter, Ketentuan Teknis & Refactoring, Konfigurasi, Overview, Panduan Penulisan Kode, Ryzumi-WABot V2 - Agent Context & Guidelines, Server & Websocket (+2 more)

### Community 5 - "package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, scripts, dev, start (+2 more)

### Community 6 - "config.js"
Cohesion: 0.05
Nodes (10): config, cleanAiResponse(), execute(), execute(), execute(), execute(), execute(), execute() (+2 more)

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, baileys, dependencies, axios, baileys, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "handler.js"
Cohesion: 0.28
Nodes (10): getAutoAiPrompt(), FORBIDDEN_COMMANDS, handleAutoAi(), loadPlugins(), plugins, watchPlugins(), botHandler(), pluginDir (+2 more)

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `messageAdapter.js`, `index.js`, `ryzumiCDN`, `handler.js`, `downloader-mega.js`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `chalk`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `cheerio`, `dotenv`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `ryzumiCDN()` connect `ryzumiCDN` to `config.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05115089514066496 - nodes in this community are weakly interconnected._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._