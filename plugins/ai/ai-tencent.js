import { executeAiRequest } from '../../libs/aiModels.js';

export default {
    command: ['tencent', 'hy3', 'hunyuan'],
    category: 'ai',
    description: 'Bertanya atau berinteraksi dengan Tencent AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData) {
        await executeAiRequest({
            sock,
            m,
            msgData,
            brandFilter: 'hy3',
            allowClaude: false,
            pluginName: 'Tencent AI'
        });
    }
};
