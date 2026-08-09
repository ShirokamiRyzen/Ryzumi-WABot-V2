import path from 'path';
import { plugins, loadPlugins, watchPlugins } from '../libs/hot-reload.js';
import { processAuth } from './auth.js';
import { validatePlugin } from './validator.js';
import { handleAutoAi } from '../libs/autoAiHandler.js';
import config from '../config.js';

// Inisialisasi Hot-Reload untuk Plugins
const pluginDir = path.join(process.cwd(), 'plugins');
await loadPlugins(pluginDir);
watchPlugins(pluginDir);

export default async function botHandler(sock, m, msgData) {
    try {
        if (!msgData.commandName) {
            if (m.key.fromMe || !msgData.messageContent || msgData.senderJid === 'status@broadcast') return;

            const { user, group, setting } = await processAuth(sock, msgData);

            if (!setting.is_public && !user.isOwner) return;
            if (setting.is_gconly && !msgData.isGroup && !user.isOwner) return;

            const isAutoAiEnabled = msgData.isGroup ? (group?.is_autogpt ?? false) : (user?.is_autogpt || setting?.is_autogpt || false);
            if (!isAutoAiEnabled) return;

            if (msgData.isGroup) {
                const rawBotId = sock?.user?.id || sock?.user?.jid || '';
                const botNumber = rawBotId.split(':')[0].split('@')[0];

                const isMentioned = (msgData.mentions || []).some(jid => jid.includes(botNumber)) ||
                    (msgData.messageContent && msgData.messageContent.includes(`@${botNumber}`));

                const quotedParticipant = msgData.contextInfo?.participant || '';
                const isQuotedBot = msgData.isQuoted && (
                    (quotedParticipant && quotedParticipant.includes(botNumber)) ||
                    msgData.contextInfo?.quotedMessage?.fromMe === true
                );

                if (!isMentioned && !isQuotedBot) return;
            }

            await handleAutoAi(sock, m, msgData, user, group, setting, plugins);
            return;
        }

        const { user, group, setting } = await processAuth(sock, msgData);

        // Logic is_public & is_gconly
        if (!setting.is_public) {
            if (!user.isOwner) return;
        } else if (setting.is_gconly) {
            if (!msgData.isGroup && !user.isOwner) return;
        }

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
