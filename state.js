// Estado compartido en memoria. Se importa donde se necesite y se muta directamente.
module.exports = {
  prefix: '!',
  customCommands: [], // [{ command, response }]
  customEmbeds: [],   // [{ command, title, description, ... }]
};