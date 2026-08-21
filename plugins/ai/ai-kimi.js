import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['kimi'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Kimi AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'kimi',
            allowClaude: false,
            pluginName: 'Kimi AI'
        });
    }
};
