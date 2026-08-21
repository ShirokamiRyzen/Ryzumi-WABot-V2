import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['glm'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan GLM AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'glm',
            allowClaude: false,
            pluginName: 'GLM AI'
        });
    }
};
