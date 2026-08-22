# Graph Report - Ryzumi-WABot V2  (2026-08-22)

## Corpus Check
- 105 files · ~34,126 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 337 nodes · 558 edges · 58 communities (25 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2afe4bf8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- autoAiHandler.js
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
- backup.js
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
- baileys

## God Nodes (most connected - your core abstractions)
1. `config` - 42 edges
2. `executeAiRequest()` - 31 edges
3. `handleAutoAi()` - 15 edges
4. `resolveLidToJid()` - 13 edges
5. `Group` - 11 edges
6. `ryzumiCDN()` - 11 edges
7. `User` - 10 edges
8. `connectToWhatsApp()` - 10 edges
9. `processAuth()` - 10 edges
10. `Setting` - 9 edges

## Surprising Connections (you probably didn't know these)
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `execute()` --calls--> `executeAiRequest()`  [EXTRACTED]
  plugins/ai/ai-chatgpt.js → libs/aiModels.js
- `execute()` --calls--> `executeAiRequest()`  [EXTRACTED]
  plugins/ai/ai-claude.js → libs/aiModels.js
- `execute()` --calls--> `executeAiRequest()`  [EXTRACTED]
  plugins/ai/ai-deepseek.js → libs/aiModels.js
- `execute()` --calls--> `executeAiRequest()`  [EXTRACTED]
  plugins/ai/ai-gemini.js → libs/aiModels.js

## Import Cycles
- None detected.

## Communities (58 total, 33 thin omitted)

### Community 0 - "index.js"
Cohesion: 0.12
Nodes (27): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), extractMessageData(), getMessageContent() (+19 more)

### Community 1 - "autoAiHandler.js"
Cohesion: 0.19
Nodes (15): postAiWithRetry(), uploadCompressedImage(), cleanAiResponse(), getAutoAiPrompt(), FORBIDDEN_COMMANDS, getQuoteOption(), handleAutoAi(), parseExecCommand() (+7 more)

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
Nodes (4): config, execute(), formatSize, execPromise

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, cheerio, dependencies, axios, cheerio, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "executeAiRequest"
Cohesion: 0.12
Nodes (20): executeAiRequest(), fetchAiModels(), getBrandRegex(), getQuoteOption(), getTextModels(), getVisionModels(), isVisionModel(), sortModels() (+12 more)

### Community 22 - "backup.js"
Cohesion: 0.60
Nodes (4): backupDatabase(), pruneOldBackups(), uploadToNextcloud(), execute()

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **75 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `index.js`, `autoAiHandler.js`, `ryzumiCDN`, `executeAiRequest`, `backup.js`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `mime-types`, `chalk`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `dotenv`, `baileys`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `executeAiRequest()` connect `executeAiRequest` to `autoAiHandler.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12270531400966184 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.053246753246753244 - nodes in this community are weakly interconnected._
- **Should `executeAiRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.11942959001782531 - nodes in this community are weakly interconnected._