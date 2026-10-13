import { webp2mp4 } from '../../libs/webp2mp4.js';
import axios from 'axios';

export default {
  command: ['tovideo', 'tovid'],
  category: 'sticker',
  isRegistered: true,
  limit: true,
  description: 'Mengubah stiker (animasi) menjadi video (tovideo/tovid).',
  async execute(sock, m, msgData) {
    // Memastikan yang dibalas adalah stiker
    if (!msgData.isQuoted || msgData.quotedType !== 'stickerMessage') {
      return sock.sendMessage(msgData.remoteJid, {
        text: 'Kakak, tolong balas stiker yang mau diubah jadi video dong~ (˶˃ ᵕ ˂˶)'
      }, { quoted: m });
    }

    await msgData.react('⏳');

    try {
      // Unduh stiker yang dibalas
      const buffer = await msgData.downloadMedia();
      if (!buffer) throw new Error('Gagal mengunduh stikernya kak.. (╥﹏╥)');

      const resultUrl = await webp2mp4(buffer);
      if (!resultUrl) {
        throw new Error('Gagal mengonversi stiker. Mungkin stikernya terlalu besar atau ada masalah di server EZGIF.. (╥﹏╥)');
      }

      const res = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });
      const finalBuffer = Buffer.from(res.data);

      await sock.sendMessage(msgData.remoteJid, {
        video: finalBuffer,
        caption: 'Ini videonya kak, sudah jadi~! (๑>ᴗ<๑)',
        mimetype: 'video/mp4'
      }, { quoted: m });

      await msgData.react('✅');
    } catch (error) {
      console.error('Sticker to Video Error:', error);
      await msgData.react('❌');
      await sock.sendMessage(msgData.remoteJid, {
        text: `Maafin aku ya kak, gagal ngubah stikernya jadi video: ${error.message}.. (｡T ω T｡)`
      }, { quoted: m });
    }
  }
};
