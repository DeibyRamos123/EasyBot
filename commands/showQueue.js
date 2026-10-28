const { EmbedBuilder } = require('discord.js');
const { queues } = require('../music/queue');

module.exports = {
  name: 'queue',
  aliases: ['cola'],
  execute(message) {
    const queue = queues.get(message.guild.id);

    if (!queue || queue.songs.length === 0) {
      return message.reply({ content: 'La cola está vacía.' });
    }

    const listado = queue.songs
      .slice(0, 10)
      .map((s, i) => i === 0 ? `▶️ **${s.title}** (sonando)` : `${i}. ${s.title}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('📜 Cola de reproducción')
      .setDescription(listado + (queue.songs.length > 10 ? `\n...y ${queue.songs.length - 10} más` : ''))
      .setColor('#5865F2');

    return message.channel.send({ embeds: [embed] });
  },
};