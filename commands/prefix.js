const state = require('../state');

module.exports = {
  name: 'prefix',
  execute(message) {
    return message.reply({ content: `Prefix is: ${state.prefix}` });
  },
};
