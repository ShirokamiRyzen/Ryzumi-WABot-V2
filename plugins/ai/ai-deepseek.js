import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['deepseek', 'deepseekai', 'ds'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan DeepSeek AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'deepseek',
            allowClaude: false,
            pluginName: 'DeepSeek AI'
        });
    }
};
