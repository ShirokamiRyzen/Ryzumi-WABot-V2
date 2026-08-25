# Graph Report - Ryzumi-WABot V2  (2026-08-25)

## Corpus Check
- 106 files · ~35,147 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 342 nodes · 572 edges · 58 communities (25 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `970a2d67`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- cheerio
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
- messageAdapter.js
- node-cron
- node-fetch
- autoAiHandler.js
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
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/owner/owner-anticall.js → databases/orm/Setting.js
- `onParticipantsUpdate()` --references--> `Group`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/Group.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `onCall()` --references--> `Setting`  [EXTRACTED]
  plugins/owner/owner-anticall.js → databases/orm/Setting.js
- `onParticipantsUpdate()` --references--> `User`  [EXTRACTED]
  plugins/group/group-welcome-leave.js → databases/orm/User.js

## Import Cycles
- None detected.

## Communities (58 total, 33 thin omitted)

### Community 0 - "index.js"
Cohesion: 0.15
Nodes (20): Group, Setting, User, connectToWhatsApp(), startTime, syncGroups(), backupDatabase(), pruneOldBackups() (+12 more)

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
Nodes (6): config, getPP(), execute(), formatSize, onParticipantsUpdate(), execPromise

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, node-os-utils, dependencies, axios, node-os-utils, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

### Community 14 - "executeAiRequest"
Cohesion: 0.12
Nodes (20): executeAiRequest(), fetchAiModels(), getBrandRegex(), getQuoteOption(), getTextModels(), getVisionModels(), isVisionModel(), sortModels() (+12 more)

### Community 22 - "messageAdapter.js"
Cohesion: 0.20
Nodes (13): extractMessageData(), getMessageContent(), getMessageType(), unwrapMessage(), sendAlbumMessage(), lidCache, resolveLidToJid(), execute() (+5 more)

### Community 25 - "autoAiHandler.js"
Cohesion: 0.19
Nodes (15): postAiWithRetry(), uploadCompressedImage(), cleanAiResponse(), getAutoAiPrompt(), FORBIDDEN_COMMANDS, getQuoteOption(), handleAutoAi(), parseExecCommand() (+7 more)

### Community 55 - "3. Tata Penulisan & Maintenance Sistem"
Cohesion: 0.14
Nodes (13): 1. Tata Penulisan & Struktur Plugin, 2. Standar Operasi Plugin (Add, Edit, Delete), 3. Tata Penulisan & Maintenance Sistem, A. Add Plugin (Menambah Plugin Baru), A. Middlewares (`/middlewares`), B. Adapters & Libs (`/libs/adapter` & `/libs`), B. Update / Edit Plugin (Memperbarui Plugin), C. Database & Migrations (`/databases`) (+5 more)

## Knowledge Gaps
- **76 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `index.js`, `ryzumiCDN`, `executeAiRequest`, `messageAdapter.js`, `autoAiHandler.js`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `cheerio`, `package.json`, `mime-types`, `chalk`, `fluent-ffmpeg`, `file-type`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `moment-timezone`, `node-cron`, `node-fetch`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`, `dotenv`, `baileys`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `executeAiRequest()` connect `executeAiRequest` to `autoAiHandler.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1497326203208556 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05141242937853107 - nodes in this community are weakly interconnected._
- **Should `executeAiRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.11942959001782531 - nodes in this community are weakly interconnected._