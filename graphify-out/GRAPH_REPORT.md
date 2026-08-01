# Graph Report - Ryzumi-WABot V2  (2026-08-01)

## Corpus Check
- 87 files · ~28,656 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 274 nodes · 419 edges · 55 communities (22 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1222895`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- config.js
- messageAdapter.js
- ryzumiCDN
- Ryzumi-WABot V2
- Ryzumi-WABot V2 - Agent Context & Guidelines
- package.json
- index.js
- dependencies
- sticker-to-media.js
- misc-ping.js
- rules/graphify.md
- workflows/graphify.md
- chalk
- cheerio
- dotenv
- file-type
- fluent-ffmpeg
- human-readable
- jimp
- jsdom
- mariadb
- mime-types
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

## God Nodes (most connected - your core abstractions)
1. `config` - 39 edges
2. `Group` - 11 edges
3. `resolveLidToJid()` - 11 edges
4. `User` - 10 edges
5. `connectToWhatsApp()` - 10 edges
6. `processAuth()` - 10 edges
7. `Setting` - 9 edges
8. `ryzumiCDN()` - 9 edges
9. `Ryzumi-WABot V2 - Agent Context & Guidelines` - 9 edges
10. `extractMessageData()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `connectToWhatsApp()` --references--> `Group`  [EXTRACTED]
  index.js → databases/orm/Group.js
- `syncGroups()` --references--> `Group`  [EXTRACTED]
  index.js → databases/orm/Group.js
- `connectToWhatsApp()` --references--> `Setting`  [EXTRACTED]
  index.js → databases/orm/Setting.js
- `execute()` --references--> `Setting`  [EXTRACTED]
  plugins/misc/misc-enable-disable.js → databases/orm/Setting.js
- `startCronJobs()` --references--> `User`  [EXTRACTED]
  libs/cronjob.js → databases/orm/User.js

## Import Cycles
- None detected.

## Communities (55 total, 33 thin omitted)

### Community 0 - "config.js"
Cohesion: 0.05
Nodes (4): config, execute(), formatSize, execPromise

### Community 1 - "messageAdapter.js"
Cohesion: 0.17
Nodes (18): Group, Setting, User, extractMessageData(), getMessageContent(), getMessageType(), unwrapMessage(), getPP() (+10 more)

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

### Community 6 - "index.js"
Cohesion: 0.14
Nodes (17): connectToWhatsApp(), startTime, syncGroups(), backupDatabase(), pruneOldBackups(), uploadToNextcloud(), logMessage(), startCronJobs() (+9 more)

### Community 7 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, baileys, dependencies, axios, baileys, qrcode-terminal, qrcode-terminal

### Community 8 - "sticker-to-media.js"
Cohesion: 0.80
Nodes (3): webp2mp4(), webp2png(), execute()

## Knowledge Gaps
- **66 isolated node(s):** `startTime`, `groupCache`, `lidCache`, `tmpDir`, `pluginDir` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `config` connect `config.js` to `messageAdapter.js`, `ryzumiCDN`, `index.js`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `chalk`, `cheerio`, `dotenv`, `file-type`, `fluent-ffmpeg`, `human-readable`, `jimp`, `jsdom`, `mariadb`, `mime-types`, `moment-timezone`, `node-cron`, `node-fetch`, `node-os-utils`, `node-webpmux`, `nodemon`, `sequelize`, `sharp`, `sqlite3`, `syntax-error`, `yargs`, `yt-search`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `startTime`, `groupCache`, `lidCache` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.053246753246753244 - nodes in this community are weakly interconnected._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._