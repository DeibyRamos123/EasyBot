const { getVoiceConnection } = require('@discordjs/voice');
const { queues } = require('../music/queue');

module.exports = {
  name: 'stop',
  aliases: ['leave'],
  execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ content: 'Entra al canal de voz para sacarme.' });

    const queue = queues.get(message.guild.id);
    const connection = getVoiceConnection(message.guild.id);

    if (queue) {
      queue.songs = [];
      queues.delete(message.guild.id);
    }

    if (connection) {
      connection.destroy();
      return message.reply({ content: 'Desconectado del canal de voz y cola vaciada.' });
    }
    return message.reply({ content: 'No estoy en ningún canal de voz.' });
  },
};
