const state = require('../state');

module.exports = {
  name: 'setprefix',
  execute(message, args) {
    const newPrefix = args[0];
    if (!newPrefix) {
      return message.reply({ content: 'Debes proporcionar un nuevo prefijo.' });
    }
    state.prefix = newPrefix;
    return message.reply({ content: `Set prefix to: ${state.prefix}` });
  },
};
