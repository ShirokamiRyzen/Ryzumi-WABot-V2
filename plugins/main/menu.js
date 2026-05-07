export default {
    command: ['menu', 'help'],
    category: 'main',
    description: 'Menampilkan daftar menu bot',
    async execute(sock, m, msgData, user, plugins) {
        const categories = {};

        // Group plugins by category
        for (const plugin of plugins) {
            if (!plugin.command) continue;
            const cat = plugin.category || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(plugin.command[0]);
        }

        let text = `Halo ${user.name || 'Kak'}!\nIni adalah menu Ryzumi-WABot.\n\n`;

        for (const [cat, commands] of Object.entries(categories)) {
            const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
            text += `[ ${catName} ]\n`;
            
            const uniqueCmds = [...new Set(commands)];
            for (const cmd of uniqueCmds) {
                text += `  - .${cmd}\n`;
            }
            text += '\n';
        }

        await sock.sendMessage(msgData.remoteJid, { text: text.trim() }, { quoted: m });
    }
};
