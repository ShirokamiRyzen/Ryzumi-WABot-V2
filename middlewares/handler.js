import fs from 'fs';
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
        const user = await processAuth(sock, msgData);

        if (!msgData.commandName) return;

        for (const plugin of plugins) {
            if (plugin.command && plugin.command.includes(msgData.commandName)) {
                const isValid = await validatePlugin(sock, m, msgData, user, plugin);
                if (!isValid) return;
                
                await plugin.execute(sock, m, msgData, user, plugins);
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
