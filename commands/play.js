const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('@iamtraction/play-dl');
const { queues, playSong } = require('../music/queue');
const { resolveTracks } = require('../music/resolver');

module.exports = {
  name: 'play',
  async execute(message, args) {
    const query = args.join(' ');
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply({ content: '¡Parce, primero tienes que entrar a un canal de voz!' });
    }

    if (!query) {
      return message.reply({ content: 'Debes proporcionar el nombre de una canción, un link de video o un link de playlist.' });
    }

    try {
      const urlType = await play.validate(query);
      if (urlType === 'yt_playlist' || urlType === 'sp_playlist' || urlType === 'sp_album') {
        await message.reply({ content: '🔎 Cargando tu playlist, esto puede tardar un poco si tiene muchas canciones...' });
      }

      const tracks = await resolveTracks(query);

      if (!tracks || tracks.length === 0) {
        return message.reply({ content: 'No se encontraron resultados para tu búsqueda.' });
      }

      tracks.forEach(t => { t.requestedBy = message.author.username; });

      let queue = queues.get(message.guild.id);

      if (!queue) {
        // No hay cola activa en este servidor: creamos una nueva y nos unimos al canal
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        queue = {
          connection,
          player,
          textChannel: message.channel,
          songs: [],
        };
        queues.set(message.guild.id, queue);

        player.on(AudioPlayerStatus.Idle, () => {
          queue.songs.shift();
          playSong(message.guild.id);
        });

        player.on('error', (err) => {
          console.error('Error en el reproductor de audio:', err);
          queue.songs.shift();
          playSong(message.guild.id);
        });

        queue.songs.push(...tracks);
        playSong(message.guild.id);

        if (tracks.length > 1) {
          return message.reply({ content: `▶️ Reproduciendo playlist: se agregaron **${tracks.length}** canciones.` });
        }
        // El mensaje de "reproduciendo ahora" ya lo manda playSong()
      } else {
        // Ya hay algo sonando: solo agregamos a la cola
        queue.songs.push(...tracks);

        if (tracks.length > 1) {
          return message.reply({ content: `➕ Se agregaron **${tracks.length}** canciones de la playlist a la cola.` });
        }
        return message.reply({ content: `➕ **${tracks[0].title}** agregada a la cola (posición ${queue.songs.length}).` });
      }
    } catch (error) {
      console.error('Error al reproducir audio:', error);
      message.reply({ content: error.message && error.message.includes('Spotify') ? error.message : 'Ocurrió un error intentando procesar el audio de YouTube.' });
    }
  },
};
