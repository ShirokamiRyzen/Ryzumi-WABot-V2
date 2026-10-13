import config from '../../config.js';
import { resolveLidToJid } from '../../libs/lid-resolver.js';

const jidToNum = (jid) => jid?.split('@')[0].split(':')[0];

export default {
  command: ['del', 'delete'],
  category: 'group',
  isGroup: true,
  description: 'Menghapus pesan untuk semua orang di grup (balas pesan yang mau dihapus).',
  async execute(sock, m, msgData) {
    // Hanya admin grup atau nomor bot itu sendiri yang boleh mengeksekusi
    if (!msgData.isAdmin && !msgData.fromMe) {
      return msgData.reply('Eits, cuma admin grup atau aku sendiri yang bisa pakai perintah ini yaa~ (｡T ω T｡)');
    }

    if (!msgData.isQuoted) {
      return msgData.reply(config.RYZUMI_MSG_QUOTED || 'Balas pesan yang mau dihapus ya kakak~ (˶˃ ᵕ ˂˶)');
    }

    const ctx = msgData.contextInfo || {};
    const stanzaId = ctx.stanzaId;

    if (!stanzaId) {
      return msgData.reply('Aduuh, aku nggak nemu ID pesannya kak.. coba balas ulang yaa~ (╥﹏╥)');
    }

    // Deteksi apakah pesan yang dibalas adalah milik bot sendiri
    const botNumbers = [jidToNum(sock.user?.id), jidToNum(sock.user?.lid)].filter(Boolean);
    const quotedParticipant = ctx.participant || '';
    const resolvedQuoted = resolveLidToJid(quotedParticipant, sock);
    const isQuotedFromBot = botNumbers.includes(jidToNum(quotedParticipant)) || botNumbers.includes(jidToNum(resolvedQuoted));

    // Jika bot bukan admin, hanya bisa menghapus pesannya sendiri
    if (!msgData.isBotAdmin && !isQuotedFromBot) {
      return msgData.reply('Aku bukan admin di grup ini kak, jadi cuma bisa hapus pesan milikku sendiri aja yaa~ (๑>ᴗ<๑)');
    }

    const targetKey = {
      remoteJid: msgData.remoteJid,
      fromMe: isQuotedFromBot,
      id: stanzaId,
      participant: quotedParticipant || undefined
    };

    try {
      await sock.sendMessage(msgData.remoteJid, { delete: targetKey });
      await msgData.react('✅');
    } catch (error) {
      console.error('Delete Message Error:', error);
      await msgData.react('❌');
      await msgData.reply(`Gomen ne, aku gagal hapus pesannya: ${error.message}.. (╥﹏╥)`);
    }
  }
};
