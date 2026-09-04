# Graph Report - Ryzumi-WABot V2  (2026-09-04)

## Corpus Check
- 106 files · ~35,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 344 nodes · 585 edges · 56 communities (23 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8244d827`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- baileys
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
- executeAiRequest
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
- dotenv

## God Nodes (most connected - your core abstractions)
1. `config` - 43 edges
2. `executeAiRequest()` - 31 edges
3. `handleAutoAi()` - 15 edges
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
- `onParticipantsUpdate()` --references--> `User`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/User.js
- `execute()` --calls--> `executeAiRequest()`  [EXTRACTED]
  plugins/ai/ai-chatgpt.js → libs/aiModels.js

## Import Cycles
- None detected.

## Communities (56 total, 33 thin omitted)

### Community 0 - "index.js"
Cohesion: 0.09
Nodes (38): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), extractMessageData(), getMessageContent() (+30 more)

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

### Community 6 - "config.js"
Cohesion: 0.05
Nodes (6): config, getPP(), execute(), formatSize, onParticipantsUpdate(), execPromise

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, cheerio, dependencies, axios, cheerio, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "executeAiRequest"
Cohesion: 0.09
Nodes (31): executeAiRequest(), fetchAiModels(), getBrandRegex(), getQuoteOption(), getTextModels(), getVisionModels(), isVisionModel(), postAiWithRetry() (+23 more)

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **74 isolated node(s):** `startTime`, `tmpDir`, `pluginDir`, `name`, `version` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `index.js`, `ryzumiCDN`, `executeAiRequest`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `baileys`, `package.json`, `mime-types`, `chalk`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `dotenv`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `startTime`, `tmpDir`, `pluginDir` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08757062146892655 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05141242937853107 - nodes in this community are weakly interconnected._
- **Should `executeAiRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.08897959183673469 - nodes in this community are weakly interconnected._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._