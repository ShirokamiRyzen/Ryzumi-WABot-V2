import axios from 'axios';
import config from '../../config.js';
import { handleAutoAi } from '../../libs/autoAiHandler.js';

export default {
    command: ['ai'],
    category: 'ai',
    description: 'Bertanya atau merespon secara otomatis dengan Auto AI (Ryzumi Starlette)',
    isRegistered: false,
    isLimit: false,
    async execute(sock, m, msgData, user, group, plugins) {
        let text = msgData.args.join(' ');

        if (msgData.isQuoted && msgData.quotedContent) {
            text = text
                ? `[Pesan yang di-reply]: "${msgData.quotedContent}"\n\n[Pertanyaan/Pesan]: ${text}`
                : msgData.quotedContent;
        }

        const isMediaImage = msgData.isMedia && /image/i.test(msgData.mime);
        const isQuotedImage = msgData.isQuotedMedia && /image/i.test(msgData.quotedMime);

        if (!text && (isMediaImage || isQuotedImage)) {
            text = 'Jelaskan gambar ini';
        }

        if (!text) {
            return sock.sendMessage(msgData.remoteJid, {
                text: `Uwaaa! Sayangku mau tanya apa sama Auto AI Ryzumi? (˶˃ ᵕ ˂˶)\n\nSilakan masukkan pertanyaan atau perintah dengan *.autoai <teks>*\nAtau aktifkan Auto AI respon pesan biasa dengan perintah *.enable autogpt* yaa~! (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        // Set messageContent to text for handleAutoAi
        const autoMsgData = {
            ...msgData,
            messageContent: text
        };

        const setting = { is_public: true, is_gconly: false, is_register: false };
        await handleAutoAi(sock, m, autoMsgData, user, group, setting, plugins);
    }
};
