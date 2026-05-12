import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../../config.js';

const execPromise = promisify(exec);

export default {
    command: ['eval', '>'],
    category: 'owner',
    isOwner: true,
    description: 'Mengeksekusi kode JavaScript langsung dari chat (Khusus Owner).',
    async execute(sock, m, msgData) {
        const code = msgData.args.join(' ');
        if (!code) return m.reply('Mana kodenya kak? (｡>ㅅ<｡)');

        await sock.sendMessage(msgData.remoteJid, { react: { text: '⏳', key: m.key } });

        let result;
        try {
            // Context for eval
            const context = {
                sock, m, msgData, config, 
                args: msgData.args,
                conn: sock, // Alias for older bot compatibility
                exec: execPromise, // Allow shell commands via eval
            };

            // Wrap code in async function to allow await
            const evalFunc = new Function(...Object.keys(context), `
                return (async () => {
                    try {
                        ${code.includes('return') ? code : `return ${code}`}
                    } catch (e) {
                        return e.message;
                    }
                })()
            `);

            result = await evalFunc(...Object.values(context));

            if (typeof result !== 'string') {
                result = JSON.stringify(result, null, 2);
            }

            await sock.sendMessage(msgData.remoteJid, {
                text: `*─「 EVAL RESULT 」─*\n\n\`\`\`javascript\n${result}\n\`\`\``
            }, { quoted: m });
            
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error('Eval Error:', error);
            await sock.sendMessage(msgData.remoteJid, {
                text: `*─「 EVAL ERROR 」─*\n\n\`\`\`bash\n${error.message}\n\`\`\``
            }, { quoted: m });
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });
        }
    }
};
