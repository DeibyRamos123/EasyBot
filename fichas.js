// Datos y utilidades del sistema de fichas. Se guarda en fichas.json
// (en la carpeta raíz del proyecto, la que tiene package.json).
const fs = require('fs');
const path = require('path');

function findRoot() {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const up = path.dirname(dir);
    if (up === dir) return __dirname;
    dir = up;
  }
  return dir;
}

const ROOT = findRoot();
const FILE = path.join(ROOT, 'fichas.json');

// { guilds: { [guildId]: { minAge, roleId, characters: [{ name, userId?, age?, fandom? }] } } }
let db = { guilds: {} };
try {
  db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!db.guilds) db.guilds = {};
} catch (err) {
  if (err.code !== 'ENOENT') console.error('Error leyendo fichas.json:', err.message);
}

function save() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando fichas.json:', err.message);
  }
}

function getGuild(guildId) {
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = { minAge: 0, roleId: null, characters: [] };
  }
  return db.guilds[guildId];
}

// Compara nombres sin importar mayúsculas, tildes ni espacios repetidos
function normalize(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isTaken(guildId, name) {
  const n = normalize(name);
  return getGuild(guildId).characters.some(c => normalize(c.name) === n);
}

function findByUser(guildId, userId) {
  return getGuild(guildId).characters.find(c => c.userId === userId);
}

function addCharacter(guildId, entry) {
  getGuild(guildId).characters.push(entry);
  save();
}

// El dueño del bot se define con "ownerId" (texto) en config.json
function isOwner(userId) {
  try {
    const { ownerId } = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
    return Boolean(ownerId) && String(ownerId) === String(userId);
  } catch {
    return false;
  }
}

// Para responder sin que un nombre con @everyone/@rol haga ping
const NO_PINGS = { parse: [], repliedUser: false };

module.exports = { save, getGuild, isTaken, findByUser, addCharacter, isOwner, NO_PINGS };
