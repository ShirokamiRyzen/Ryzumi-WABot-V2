import axios from 'axios';
import config from '../config.js';
import { validatePlugin } from '../middlewares/validator.js';
import { getAutoAiPrompt, cleanAiResponse } from './aiPrompt.js';

const FORBIDDEN_COMMANDS = ['eval', 'exec', 'delprem', 'addprem', 'backup', 'debug', 'enable', 'disable', 'on', 'off'];

/**
 * Handler for Auto AI / AutoGPT (Processes non-command messages when enabled)
 */
export async function handleAutoAi(sock, m, msgData, user, group, setting, plugins) {
    try {
        // Send presence update 'composing' (efek mengetik) for realistic interaction
        if (sock?.sendPresenceUpdate && msgData?.remoteJid) {
            await sock.sendPresenceUpdate('composing', msgData.remoteJid).catch(() => { });
        }

        let session;
        if (msgData.isGroup) {
            const groupNumber = (msgData.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
            session = `ryzumi-wabot-${groupNumber}`;
        } else {
            const rawNumber = (msgData.senderJid || m?.sender || '').split('@')[0].replace(/[^0-9]/g, '');
            session = `ryzumi-wabot-${rawNumber || 'user'}`;
        }

        // Dynamically build list of available commands and descriptions for the AI model
        const cmdList = plugins
            .filter(p => p.command && !p.isOwner && p.category !== 'owner')
            .map(p => `.${p.command[0]}: ${p.description || p.category}`)
            .join('\n');

        const prompt = getAutoAiPrompt(cmdList);

        const modelsToTry = ['auto', 'hy3', 'auto-debug'];
        let data = null;

        for (const modelName of modelsToTry) {
            try {
                const payload = {
                    text: msgData.messageContent,
                    model: modelName,
                    prompt: prompt,
                    session: session
                };

                const res = await axios.post(`${config.API_RYZUMI}/api/ai/post/text-model`, payload);
                if (res?.data && (res.data.success || res.data.status) && res.data.result) {
                    data = res.data;
                    break;
                }
            } catch (err) {
                console.warn(`Auto AI model '${modelName}' failed, attempting next fallback...`);
            }
        }

        if (!data || !data.result) {
            return;
        }

        const fullResult = data.result;

        // Sanitize backticks/markdown formatting from LLM response if present
        const sanitizedResult = fullResult.replace(/[`*]/g, '');
        const execMatch = sanitizedResult.match(/\[EXEC:\s*(\.[^\]]+)\]/i);
        const rawTextOnly = fullResult.replace(/`?\[EXEC:\s*(\.[^\]]+)\]`?/gi, '').trim();
        const textOnly = cleanAiResponse(rawTextOnly);

        if (execMatch) {
            const rawCmdStr = execMatch[1].trim(); // e.g. ".ssweb https://..."
            const parts = rawCmdStr.slice(1).trim().split(/ +/);
            const targetCmd = parts.shift()?.toLowerCase();

            if (!targetCmd || FORBIDDEN_COMMANDS.includes(targetCmd)) {
                if (textOnly) {
                    await sock.sendMessage(msgData.remoteJid, { text: textOnly }, { quoted: m });
                } else {
                    await sock.sendMessage(msgData.remoteJid, {
                        text: `Uwaaa! Perintah itu tidak diizinkan demi keamanan bot kak~ (｡T ω T｡)`
                    }, { quoted: m });
                }
                return;
            }

            const targetPlugin = plugins.find(p => p.command && p.command.includes(targetCmd));

            if (!targetPlugin) {
                if (textOnly) {
                    await sock.sendMessage(msgData.remoteJid, { text: textOnly }, { quoted: m });
                }
                return;
            }

            if (targetPlugin.isOwner && !user.isOwner) {
                await sock.sendMessage(msgData.remoteJid, {
                    text: `Aduuh! Perintah ini khusus untuk Owner Ryzumi kak~ (｡T ω T｡)`
                }, { quoted: m });
                return;
            }

            // Create simulated msgData for target plugin execution
            const simMsgData = {
                ...msgData,
                commandName: targetCmd,
                args: parts
            };

            const isValid = await validatePlugin(sock, m, simMsgData, user, group, targetPlugin, setting);
            if (isValid) {
                await targetPlugin.execute(sock, m, simMsgData, user, group, plugins);
            }
        } else if (textOnly) {
            await sock.sendMessage(msgData.remoteJid, { text: textOnly }, { quoted: m });
        }

    } catch (error) {
        console.error('Auto AI Handler Error:', error);
    }
}
