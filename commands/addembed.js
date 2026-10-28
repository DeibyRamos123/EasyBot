const state = require('../state');
const { addCustomEmbed } = require('../storage');

// Uso: !addembed <comando> | <titulo> | <descripcion> | [thumbnail] | [image] | [color] | [author:si/no]
module.exports = {
  name: 'addembed',
  async execute(message, args, commandName) {
    const rawArgs = message.content.slice((state.prefix + commandName).length).trim();
    const parts = rawArgs.split('|').map(p => p.trim());

    const [cmd, title, description, thumbnail, image, embedColor, authorFlag] = parts;

    if (!cmd || !title) {
      return message.reply({
        content:
          'Uso: `!addembed <comando> | <titulo> | <descripcion> | [thumbnail] | [image] | [color] | [author:si/no]`\n' +
          'Ejemplo: `!addembed reglas | Reglas del servidor | 1. Respeto 2. No spam | | | 0x00FF00 | si`',
      });
    }

    if (state.customEmbeds.some(c => c.command.toLowerCase() === cmd.toLowerCase())) {
      return message.reply({ content: `Ya existe un embed llamado \`${cmd}\`.` });
    }

    const embedData = {
      command: cmd.toLowerCase(),
      title: title || null,
      description: description || null,
      thumbnail: thumbnail || null,
      image: image || null,
      embedColor: embedColor || null,
      author: authorFlag ? ['si', 'true', 'yes'].includes(authorFlag.toLowerCase()) : false,
    };

    await addCustomEmbed(embedData);
    return message.reply({ content: `Embed \`${state.prefix}${cmd}\` creado correctamente.` });
  },
};
