# Graph Report - Ryzumi-WABot V2  (2026-08-09)

## Corpus Check
- 98 files · ~32,629 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 312 nodes · 533 edges · 60 communities (24 shown, 36 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a17cd443`
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
- autoAiHandler.js
- handleAutoAi
- fluent-ffmpeg
- file-type
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
- baileys
- downloader-mega.js
- cheerio
- dotenv

## God Nodes (most connected - your core abstractions)
1. `config` - 48 edges
2. `cleanAiResponse()` - 17 edges
3. `getQuoteOption()` - 16 edges
4. `resolveLidToJid()` - 13 edges
5. `ryzumiCDN()` - 13 edges
6. `Group` - 11 edges
7. `handleAutoAi()` - 11 edges
8. `User` - 10 edges
9. `connectToWhatsApp()` - 10 edges
10. `processAuth()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `onParticipantsUpdate()` --references--> `Group`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/Group.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `processAuth()` --references--> `User`  [EXTRACTED]
  middlewares/auth.js → databases/orm/User.js
- `execute()` --references--> `User`  [EXTRACTED]
  plugins/misc/misc-bot-statistic.js → databases/orm/User.js
- `connectToWhatsApp()` --calls--> `extractMessageData()`  [EXTRACTED]
  index.js → libs/adapter/messageAdapter.js

## Import Cycles
- None detected.

## Communities (60 total, 36 thin omitted)

### Community 0 - "messageAdapter.js"
Cohesion: 0.21
Nodes (13): User, extractMessageData(), getMessageContent(), getMessageType(), unwrapMessage(), backupDatabase(), pruneOldBackups(), uploadToNextcloud() (+5 more)

### Community 1 - "index.js"
Cohesion: 0.12
Nodes (23): Group, Setting, connectToWhatsApp(), startTime, syncGroups(), logMessage(), getGroupMetadata(), groupCache (+15 more)

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

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, chalk, dependencies, axios, chalk, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 13 - "autoAiHandler.js"
Cohesion: 0.35
Nodes (9): cleanAiResponse(), getQuoteOption(), execute(), execute(), execute(), execute(), execute(), execute() (+1 more)

### Community 14 - "handleAutoAi"
Cohesion: 0.50
Nodes (4): getAutoAiPrompt(), FORBIDDEN_COMMANDS, handleAutoAi(), execute()

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `messageAdapter.js`, `index.js`, `ryzumiCDN`, `autoAiHandler.js`, `handleAutoAi`, `owner-eval.js`, `downloader-mega.js`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `baileys`, `cheerio`, `dotenv`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `ryzumiCDN()` connect `ryzumiCDN` to `autoAiHandler.js`, `handleAutoAi`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12280701754385964 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05959183673469388 - nodes in this community are weakly interconnected._
- **Should `3. Tata Penulisan & Maintenance Sistem` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._