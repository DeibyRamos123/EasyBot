const state = require('../state');
const commands = require('../commands/index');
const { handleCustom } = require('../commands/custom');

module.exports = async function onMessageCreate(message) {
  if (message.author.bot || !message.content.startsWith(state.prefix)) return;

  const args = message.content.slice(state.prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = commands.get(commandName);
  if (command) return command.execute(message, args, commandName);

  return handleCustom(message, commandName);
};
