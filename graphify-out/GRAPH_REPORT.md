# Graph Report - Ryzumi-WABot V2  (2026-08-09)

## Corpus Check
- 97 files · ~32,062 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 309 nodes · 498 edges · 58 communities (24 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `529d9aef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
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
- backup.js
- dotenv

## God Nodes (most connected - your core abstractions)
1. `config` - 47 edges
2. `cleanAiResponse()` - 15 edges
3. `Group` - 11 edges
4. `resolveLidToJid()` - 11 edges
5. `ryzumiCDN()` - 11 edges
6. `User` - 10 edges
7. `connectToWhatsApp()` - 10 edges
8. `processAuth()` - 10 edges
9. `Setting` - 9 edges
10. `extractMessageData()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `startCronJobs()` --references--> `User`  [EXTRACTED]
  libs/cronjob.js → databases/orm/User.js
- `connectToWhatsApp()` --calls--> `startCronJobs()`  [EXTRACTED]
  index.js → libs/cronjob.js
- `execute()` --calls--> `cleanAiResponse()`  [EXTRACTED]
  plugins/ai/ai-deepseek.js → libs/aiPrompt.js
- `execute()` --calls--> `cleanAiResponse()`  [EXTRACTED]
  plugins/ai/ai-glm.js → libs/aiPrompt.js

## Import Cycles
- None detected.

## Communities (58 total, 34 thin omitted)

### Community 1 - "index.js"
Cohesion: 0.13
Nodes (26): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), extractMessageData(), getMessageContent() (+18 more)

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
Nodes (9): config, cleanAiResponse(), execute(), execute(), execute(), execute(), execute(), execute() (+1 more)

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, baileys, dependencies, axios, baileys, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "handler.js"
Cohesion: 0.29
Nodes (9): getAutoAiPrompt(), FORBIDDEN_COMMANDS, handleAutoAi(), loadPlugins(), plugins, watchPlugins(), pluginDir, validatePlugin() (+1 more)

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

### Community 63 - "backup.js"
Cohesion: 0.46
Nodes (5): backupDatabase(), pruneOldBackups(), uploadToNextcloud(), startCronJobs(), execute()

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `index.js`, `ryzumiCDN`, `handler.js`, `downloader-mega.js`, `backup.js`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `chalk`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `cheerio`, `dotenv`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `ryzumiCDN()` connect `ryzumiCDN` to `config.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12579281183932348 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.051560379918588875 - nodes in this community are weakly interconnected._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._