# Graph Report - Ryzumi-WABot V2  (2026-08-13)

## Corpus Check
- 99 files · ~32,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 539 edges · 58 communities (23 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19503326`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- handler.js
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
- baileys
- fluent-ffmpeg
- human-readable
- jimp
- jsdom
- mariadb
- owner-eval.js
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
- chalk
- downloader-mega.js
- cheerio
- dotenv

## God Nodes (most connected - your core abstractions)
1. `config` - 49 edges
2. `getQuoteOption()` - 18 edges
3. `cleanAiResponse()` - 17 edges
4. `resolveLidToJid()` - 13 edges
5. `ryzumiCDN()` - 13 edges
6. `Group` - 11 edges
7. `handleAutoAi()` - 11 edges
8. `User` - 10 edges
9. `connectToWhatsApp()` - 10 edges
10. `processAuth()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `processAuth()` --references--> `Group`  [EXTRACTED]
  middlewares/auth.js → databases/orm/Group.js
- `processAuth()` --references--> `Setting`  [EXTRACTED]
  middlewares/auth.js → databases/orm/Setting.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `processAuth()` --references--> `User`  [EXTRACTED]
  middlewares/auth.js → databases/orm/User.js
- `connectToWhatsApp()` --calls--> `botHandler()`  [EXTRACTED]
  index.js → middlewares/handler.js

## Import Cycles
- None detected.

## Communities (58 total, 35 thin omitted)

### Community 0 - "index.js"
Cohesion: 0.14
Nodes (23): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), extractMessageData(), getMessageContent() (+15 more)

### Community 1 - "handler.js"
Cohesion: 0.18
Nodes (13): getGroupMetadata(), groupCache, loadPlugins(), plugins, watchPlugins(), lidCache, resolveLidToJid(), processAuth() (+5 more)

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
Cohesion: 0.06
Nodes (15): config, cleanAiResponse(), getAutoAiPrompt(), FORBIDDEN_COMMANDS, getQuoteOption(), handleAutoAi(), execute(), execute() (+7 more)

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, file-type, dependencies, axios, file-type, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `index.js`, `handler.js`, `ryzumiCDN`, `owner-eval.js`, `downloader-mega.js`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `baileys`, `fluent-ffmpeg`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `chalk`, `cheerio`, `dotenv`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `ryzumiCDN()` connect `ryzumiCDN` to `config.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13655761024182078 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05837837837837838 - nodes in this community are weakly interconnected._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._