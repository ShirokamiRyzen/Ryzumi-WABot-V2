import fs from 'fs';
import path from 'path';
import User from '../databases/orm/User.js';
import config from '../config.js';
import { plugins, loadPlugins, watchPlugins } from '../libs/hot-reload.js';

// Inisialisasi Hot-Reload untuk Plugins
const pluginDir = path.join(process.cwd(), 'plugins');
await loadPlugins(pluginDir);
watchPlugins(pluginDir);

export default async function botHandler(sock, m, msgData) {
    // 1. Dapatkan atau buat User di Database
    const [user] = await User.findOrCreate({
        where: { jid: msgData.senderJid },
        defaults: {
            name: msgData.pushName,
            is_registered: false
        }
    });

    // Update nama user jika ada perubahan
    if (user.name !== msgData.pushName && msgData.pushName) {
        await user.update({ name: msgData.pushName });
    }

    // Identifikasi Owner / Bot
    const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const isOwner = (msgData.senderJid === ownerJid) || (msgData.senderJid === botJid) || msgData.fromMe;

    // Injeksi properti isOwner, dan berikan bypass limit/premium
    user.isOwner = isOwner;
    if (isOwner) {
        user.is_premium = true;
        user.limit = 999999;
    }

    if (!msgData.commandName) return;

    // Dispatch ke plugin (Action Adapter)
    for (const plugin of plugins) {
        if (plugin.command && plugin.command.includes(msgData.commandName)) {
            // Validasi chat pribadi
            if (plugin.isPrivate && msgData.isGroup) {
                await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_PRIVATE }, { quoted: m });
                return;
            }

            // Validasi chat grup
            if (plugin.isGroup && !msgData.isGroup) {
                await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_GROUP }, { quoted: m });
                return;
            }

            // Validasi User Terdaftar (Register)
            if (plugin.isRegistered && !user.is_registered && !user.isOwner) {
                await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_REGISTER || '❌ Kamu harus mendaftar terlebih dahulu sebelum menggunakan fitur ini.' }, { quoted: m });
                return;
            }

            // Validasi Limit
            if (plugin.limit) {
                const isLimitBypassed = user.isOwner || user.is_premium;
                
                if (user.limit < plugin.limit && !isLimitBypassed) {
                    await sock.sendMessage(msgData.remoteJid, { text: config.RYZUMI_MSG_LIMIT || '❌ Batas penggunaan harian sudah habis. Coba lagi besok ya~' }, { quoted: m });
                    return;
                }
                if (!isLimitBypassed) {
                    user.limit -= plugin.limit;
                    await user.save();
                }
            }
            
            try {
                // Plugin signature dibuat lebih ringkas dengan mem-passing msgData hasil ekstraksi
                await plugin.execute(sock, m, msgData, user, plugins);
            } catch (error) {
                console.error(`Error saat menjalankan command ${msgData.commandName}:`, error);
            }
            break;
        }
    }
}
