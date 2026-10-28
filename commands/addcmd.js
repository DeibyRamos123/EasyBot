const state = require('../state');
const { addCustomCommand } = require('../storage');

// Uso: !addcmd <nombreComando> <respuesta>
module.exports = {
  name: 'addcmd',
  async execute(message, args) {
    const newCommand = args[0];
    const response = args.slice(1).join(' ');

    if (!newCommand || !response) {
      return message.reply({ content: 'Uso: `!addcmd <comando> <respuesta>`' });
    }

    if (state.customCommands.some(c => c.command.toLowerCase() === newCommand.toLowerCase())) {
      return message.reply({ content: `Ya existe un comando llamado \`${newCommand}\`.` });
    }

    await addCustomCommand(newCommand.toLowerCase(), response);
    return message.reply({ content: `Comando \`${state.prefix}${newCommand}\` creado correctamente.` });
  },
};
