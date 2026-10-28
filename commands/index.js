// Registro de comandos integrados. Para agregar uno nuevo:
// 1) crea src/commands/miComando.js con { name, aliases?, execute }
// 2) agrégalo a esta lista.
const list = [
  require('./play'),
  require('./skip'),
  require('./showQueue'),
  require('./stop'),
  require('./setprefix'),
  require('./prefix'),
  require('./addcmd'),
  require('./addembed'),
  require('./listCommands'),
  require('./ficha'),
  require('./setFicha'),
  require('./cleanFicha'),
];

const commands = new Map();
for (const cmd of list) {
  commands.set(cmd.name, cmd);
  for (const alias of cmd.aliases || []) commands.set(alias, cmd);
}

module.exports = commands;