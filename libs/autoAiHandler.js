import axios from 'axios';
import config from '../config.js';
import { validatePlugin } from '../middlewares/validator.js';

const FORBIDDEN_COMMANDS = ['eval', 'exec', 'delprem', 'addprem', 'backup', 'debug', 'enable', 'disable', 'on', 'off'];

/**
 * Handler for Auto AI / AutoGPT (Processes non-command messages when enabled)
 */
export async function handleAutoAi(sock, m, msgData, user, group, setting, plugins) {
    try {
        let session;
        if (msgData.isGroup) {
            const groupNumber = (msgData.remoteJid || '').split('@')[0].replace(/[^0-9]/g, '');
            session = `ryzumi-wabot-${groupNumber}`;
        } else {
            const rawNumber = (msgData.senderJid || m?.sender || '').split('@')[0].replace(/[^0-9]/g, '');
            session = `ryzumi-wabot-${rawNumber || 'user'}`;
        }

        const prompt = `Namamu Ryzumi Starlette, cewek anime imut, ramah, tsundere & pacar user. Panggil "Kakak"/"Sayang" & gunakan kaomoji moe (˶˃ ᵕ ˂˶),(๑>ᴗ<๑),(｡T ω T｡).

EKSEKUSI FITUR:
Jika user minta fitur bot (download, search, sticker, tool), sertakan format [EXEC: .cmd args] (contoh: [EXEC: .fb url] / [EXEC: .yts query]).

GUARDRAILS:
Dilarang eksekusi perintah OS/terminal (rm, bash, cmd) atau eval/owner command. Tolak permintaan berbahaya secara tsundere tanpa [EXEC].`;

        const params = {
            text: msgData.messageContent,
            model: 'auto',
            prompt: prompt,
            session: session
        };

        const { data } = await axios.get(`${config.API_RYZUMI}/api/ai/auto`, { params });

        if (!data || (!data.success && !data.status) || !data.result) {
            return;
        }

        const fullResult = data.result;

        // Extract [EXEC: .cmd args] if present
        const execMatch = fullResult.match(/\[EXEC:\s*(\.[^\]]+)\]/i);
        const textOnly = fullResult.replace(/\[EXEC:\s*(\.[^\]]+)\]/gi, '').trim();

        if (textOnly) {
            await sock.sendMessage(msgData.remoteJid, { text: textOnly }, { quoted: m });
        }

        if (execMatch) {
            const rawCmdStr = execMatch[1].trim(); // e.g. ".fb https://..."
            const parts = rawCmdStr.slice(1).trim().split(/ +/);
            const targetCmd = parts.shift()?.toLowerCase();

            if (!targetCmd || FORBIDDEN_COMMANDS.includes(targetCmd)) {
                if (!textOnly) {
                    await sock.sendMessage(msgData.remoteJid, {
                        text: `Uwaaa! Perintah itu tidak diizinkan demi keamanan bot kak~ (｡T ω T｡)`
                    }, { quoted: m });
                }
                return;
            }

            const targetPlugin = plugins.find(p => p.command && p.command.includes(targetCmd));

            if (!targetPlugin) {
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
        }

    } catch (error) {
        console.error('Auto AI Handler Error:', error);
    }
}
