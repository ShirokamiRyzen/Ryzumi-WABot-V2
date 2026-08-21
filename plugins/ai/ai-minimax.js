import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['minimax', 'minimaxai'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan MiniMax AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'minimax',
            allowClaude: false,
            pluginName: 'MiniMax AI'
        });
    }
};
