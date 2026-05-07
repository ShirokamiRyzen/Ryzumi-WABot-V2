import fs from 'fs';
import path from 'path';
import { plugins, loadPlugins, watchPlugins } from '../libs/hot-reload.js';
import { processAuth } from './auth.js';
import { validatePlugin } from './validator.js';

// Inisialisasi Hot-Reload untuk Plugins
const pluginDir = path.join(process.cwd(), 'plugins');
await loadPlugins(pluginDir);
watchPlugins(pluginDir);

export default async function botHandler(sock, m, msgData) {
    const user = await processAuth(sock, msgData);

    if (!msgData.commandName) return;

    for (const plugin of plugins) {
        if (plugin.command && plugin.command.includes(msgData.commandName)) {
            const isValid = await validatePlugin(sock, m, msgData, user, plugin);
            if (!isValid) return;
            
            try {
                await plugin.execute(sock, m, msgData, user, plugins);
            } catch (error) {
                console.error(`Error saat menjalankan command ${msgData.commandName}:`, error);
            }
            break;
        }
    }
}
