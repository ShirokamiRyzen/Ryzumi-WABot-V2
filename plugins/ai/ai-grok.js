import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['grok', 'grokai', 'xai'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Grok AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'grok',
            allowClaude: false,
            pluginName: 'Grok AI'
        });
    }
};
