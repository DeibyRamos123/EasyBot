const { EmbedBuilder } = require('discord.js');
const state = require('../state');

module.exports = {
  name: 'commands',
  aliases: ['comandos'],
  execute(message) {
    const listaCmds = state.customCommands.map(c => `\`${state.prefix}${c.command}\``).join(', ') || 'Ninguno';
    const listaEmbeds = state.customEmbeds.map(c => `\`${state.prefix}${c.command}\``).join(', ') || 'Ninguno';

    const embed = new EmbedBuilder()
      .setTitle('📋 Comandos personalizados')
      .addFields(
        { name: 'Respuestas de texto', value: listaCmds },
        { name: 'Embeds', value: listaEmbeds }
      )
      .setColor('#5865F2');

    return message.channel.send({ embeds: [embed] });
  },
};
