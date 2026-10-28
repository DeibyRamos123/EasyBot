const { queues } = require('../music/queue');

module.exports = {
  name: 'skip',
  execute(message) {
    const queue = queues.get(message.guild.id);

    if (!queue || queue.songs.length === 0) {
      return message.reply({ content: 'No hay nada reproduciéndose ahora mismo.' });
    }

    message.reply({ content: `⏭️ Saltando **${queue.songs[0].title}**...` });
    queue.player.stop(); // Dispara AudioPlayerStatus.Idle y pasa a la siguiente automáticamente
  },
};
