import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['qwen', 'qwenai', 'alibaba'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Qwen AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'qwen',
            allowClaude: false,
            pluginName: 'Qwen AI'
        });
    }
};
