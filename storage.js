const fs = require('fs').promises;
const path = require('path');
const state = require('./state');

const ROOT = path.join(__dirname, '.');
const EMBEDS_FILE = path.join(ROOT, 'embeds.json');
const COMMANDS_FILE = path.join(ROOT, 'commands.json');

// Carga asíncrona de datos al iniciar
async function loadBotData() {
  try {
    const embedsData = await fs.readFile(EMBEDS_FILE, 'utf8');
    state.customEmbeds = JSON.parse(embedsData).customEmbed || [];
    console.log('Custom embeds loaded:', state.customEmbeds.length);
  } catch (err) {
    console.error('Error reading embeds.json:', err.message);
  }

  try {
    const commandsData = await fs.readFile(COMMANDS_FILE, 'utf8');
    state.customCommands = JSON.parse(commandsData).customCommands || [];
    console.log('Custom commands loaded:', state.customCommands.length);
  } catch (err) {
    console.error('Error reading commands.json:', err.message);
  }
}

// Guardar comandos personalizados (respuestas de texto)
async function addCustomCommand(command, response) {
  state.customCommands.push({ command, response });
  const payload = JSON.stringify({ customCommands: state.customCommands }, null, 2);
  await fs.writeFile(COMMANDS_FILE, payload, 'utf8');
}

// Guardar embeds personalizados
async function addCustomEmbed(embedData) {
  state.customEmbeds.push(embedData);
  const payload = JSON.stringify({ customEmbed: state.customEmbeds }, null, 2);
  await fs.writeFile(EMBEDS_FILE, payload, 'utf8');
}

module.exports = { loadBotData, addCustomCommand, addCustomEmbed };
