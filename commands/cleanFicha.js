const state = require('../state');
const fichas = require('../fichas');

module.exports = {
  name: 'cleanficha',
  execute(message) {
    if (!fichas.isOwner(message.author.id)) {
      return message.reply({ content: 'Solo el dueño del bot puede usar este comando.', allowedMentions: fichas.NO_PINGS });
    }

    const data = fichas.getGuild(message.guild.id);
    const total = data.characters.length;
    data.characters = [];
    fichas.save();

    return message.reply({
      content: `🧹 Lista de personajes limpiada (${total} eliminados). Todos pueden volver a usar \`${state.prefix}ficha\`.`,
      allowedMentions: fichas.NO_PINGS,
    });
  },
};
