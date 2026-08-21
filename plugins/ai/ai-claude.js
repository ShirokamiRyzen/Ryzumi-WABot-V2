import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['claude', 'anthropic', 'sonnet', 'opus'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Claude AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'claude',
            allowClaude: true,
            pluginName: 'Claude AI'
        });
    }
};
