const { EmbedBuilder } = require('discord.js');
const state = require('../state');

// Se ejecuta cuando el comando NO es uno integrado: busca entre los
// comandos de texto y los embeds creados con !addcmd / !addembed.
function handleCustom(message, commandName) {
  // --- Comandos personalizados (texto) ---
  const customCommand = state.customCommands.find(c => c.command.toLowerCase() === commandName);
  if (customCommand) {
    return message.reply({ content: customCommand.response });
  }

  // --- Embeds personalizados ---
  const customCommandEmbed = state.customEmbeds.find(c => c.command.toLowerCase() === commandName);
  if (customCommandEmbed) {
    const embed = new EmbedBuilder()
      .setTitle(customCommandEmbed.title || 'Sin título definido')
      .setDescription(customCommandEmbed.description || 'Sin descripción definida')
      .setThumbnail(customCommandEmbed.thumbnail || null)
      .setImage(customCommandEmbed.image || null);

    if (customCommandEmbed.embedColor) {
      const color = customCommandEmbed.embedColor;
      if (typeof color === 'string' && color.startsWith('0x')) {
        embed.setColor(parseInt(color, 16));
      } else {
        embed.setColor(color);
      }
    }

    if (customCommandEmbed.author) {
      embed.setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
        url: `https://discord.com/users/${message.author.id}`,
      });
    }

    if (Array.isArray(customCommandEmbed.fields) && customCommandEmbed.fields.length > 0) {
      embed.addFields(customCommandEmbed.fields);
    }

    if (customCommandEmbed.footer && customCommandEmbed.footer.text) {
      embed.setFooter({
        text: customCommandEmbed.footer.text,
        iconURL: customCommandEmbed.footer.iconURL || undefined,
      });
    }

    return message.channel.send({ embeds: [embed] });
  }
}

module.exports = { handleCustom };
