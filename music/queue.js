const { EmbedBuilder } = require('discord.js');
const { createAudioResource } = require('@discordjs/voice');
const play = require('@iamtraction/play-dl'); // fork mantenido de play-dl

// Cola de reproducción por servidor (guildId -> { connection, player, textChannel, songs })
const queues = new Map();

// Reproduce la primera canción de la cola de un servidor. Si no hay más, se desconecta.
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  if (queue.songs.length === 0) {
    queue.connection.destroy();
    queues.delete(guildId);
    return;
  }

  const song = queue.songs[0];

  try {
    let stream;
    try {
      stream = await play.stream(song.url, { quality: 2 });
    } catch (streamError) {
      console.error('Fallo con calidad alta, reintentando con calidad baja:', streamError.message);
      stream = await play.stream(song.url, { quality: 0 });
    }

    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    queue.player.play(resource);

    const embed = new EmbedBuilder()
      .setTitle('🎶 Reproduciendo ahora')
      .setDescription(`[${song.title}](${song.url})`)
      .setColor('#FF0000')
      .setFooter({ text: `Pedido por ${song.requestedBy} · ${queue.songs.length - 1} en cola` });

    queue.textChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error al reproducir audio:', error);
    queue.textChannel.send({ content: `No se pudo reproducir **${song.title}**, saltando a la siguiente...` });
    queue.songs.shift();
    return playSong(guildId);
  }
}




module.exports = { queues, playSong };
