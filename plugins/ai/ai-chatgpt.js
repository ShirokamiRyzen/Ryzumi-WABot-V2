import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['chatgpt', 'gpt'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan AI ChatGPT (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'gpt',
            allowClaude: false,
            pluginName: 'ChatGPT'
        });
    }
};
