import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['mistral', 'mistralai'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Mistral AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'mistral',
            allowClaude: false,
            pluginName: 'Mistral AI'
        });
    }
};
