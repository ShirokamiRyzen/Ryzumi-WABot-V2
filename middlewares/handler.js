import path from 'path';
import { plugins, loadPlugins, watchPlugins } from '../libs/hot-reload.js';
import { processAuth } from './auth.js';
import { validatePlugin } from './validator.js';
import config from '../config.js';

// Inisialisasi Hot-Reload untuk Plugins
const pluginDir = path.join(process.cwd(), 'plugins');
await loadPlugins(pluginDir);
watchPlugins(pluginDir);

export default async function botHandler(sock, m, msgData) {
    try {
        // Cek apakah ini command atau bukan sebelum melakukan proses Auth yang berat (DB/Metadata)
        // Ini mencegah bot 'bengong' karena antrean DB/Network saat grup sangat ramai
        if (!msgData.commandName) return;

        const { user, group, setting } = await processAuth(sock, msgData);

        // Logic is_public: Jika false, hanya bot & owner yang bisa akses command
        if (!setting.is_public && !user.isOwner) return;

        for (const plugin of plugins) {
            if (plugin.command && plugin.command.includes(msgData.commandName)) {
                const isValid = await validatePlugin(sock, m, msgData, user, group, plugin, setting);
                if (!isValid) return;

                await plugin.execute(sock, m, msgData, user, group, plugins);
                break;
            }
        }
    } catch (error) {
        console.error('Global Handler Error:', error);
        const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
        await sock.sendMessage(ownerJid, {
            text: `[SYSTEM ERROR]\n\nMsg: ${error.message}\n\nStack:\n${error.stack}`
        });
    }
}
