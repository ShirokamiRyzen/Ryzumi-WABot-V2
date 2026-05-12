import axios from 'axios';

export default {
    command: ['iqc'],
    category: 'maker',
    isRegistered: true,
    limit: 1,
    description: 'Membuat tampilan chat bubble tapi dalam bentuk gambar (bukan stiker).',
    async execute(sock, m, msgData) {
        const { config, quotedContent, args, isQuoted, remoteJid } = msgData;

        // Ambil teks dari argumen atau dari pesan yang di-reply
        let text = args.join(' ');
        if (!text && isQuoted) {
            text = quotedContent;
        }

        if (!text) {
            return msgData.reply(config.RYZUMI_MSG_QUOTED);
        }

        await msgData.react('⏳');

        try {
            const params = new URLSearchParams({ text: String(text) });
            const url = `${config.API_RYZUMI}/api/image/iqc?${params.toString()}`;

            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            
            if (response.headers['content-type']?.includes('image')) {
                await sock.sendMessage(remoteJid, {
                    image: Buffer.from(response.data),
                    caption: `Nih kak, gelembung chat-nya dalam versi gambar! Cantik kan? (๑>ᴗ<๑)`
                }, { quoted: m });
            } else {
                throw new Error('API gagal mereturn gambar');
            }

            await msgData.react('✅');

        } catch (error) {
            console.error('IQC Error:', error);
            await msgData.react('❌');
            await msgData.reply(`Aduuh gawat! Ryzumi gagal bikin gambarnya kak: ${error.message}.. (╥﹏╥)`);
        }
    }
};
