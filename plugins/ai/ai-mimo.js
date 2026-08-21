import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['mimo', 'mimoai', 'xiaomi'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Xiaomi Mimo AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'mimo',
            allowClaude: false,
            pluginName: 'Mimo AI'
        });
    }
};
