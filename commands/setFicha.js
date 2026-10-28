const { EmbedBuilder } = require('discord.js');
const state = require('../state');
const fichas = require('../fichas');

function reply(message, content) {
  return message.reply({ content, allowedMentions: fichas.NO_PINGS });
}

module.exports = {
  name: 'setficha',
  async execute(message, args) {
    if (!fichas.isOwner(message.author.id)) {
      return reply(message, 'Solo el dueño del bot puede usar este comando (se define con `ownerId` en config.json).');
    }

    const p = state.prefix;
    const guildId = message.guild.id;
    const data = fichas.getGuild(guildId);
    const sub = (args.shift() || '').toLowerCase();

    switch (sub) {
      // !setFicha edad 18   |   !setFicha edad off
      case 'edad': {
        const value = (args[0] || '').toLowerCase();
        if (['off', '0', 'desactivar'].includes(value)) {
          data.minAge = 0;
          fichas.save();
          return reply(message, '✅ Límite de edad desactivado.');
        }
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 99) {
          return reply(message, `Uso: \`${p}setFicha edad <número>\` o \`${p}setFicha edad off\``);
        }
        data.minAge = n;
        fichas.save();
        return reply(message, `✅ Edad mínima: **${n}**. Quien ponga una edad menor será expulsado (sin ban).`);
      }

      // !setFicha rol @Aprobado   (también acepta ID o nombre)
      case 'rol': {
        const role =
          message.mentions.roles.first() ||
          message.guild.roles.cache.get(args[0]) ||
          message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
        if (!role) {
          return reply(message, `No encontré ese rol. Uso: \`${p}setFicha rol @rol\``);
        }
        data.roleId = role.id;
        fichas.save();
        return reply(message, `✅ Rol de aprobado: **${role.name}**.`);
      }

      // !setFicha personajes Goku, Naruto, Luffy
      case 'personajes':
      case 'personaje': {
        const names = args.join(' ').split(',').map(s => s.trim()).filter(Boolean);
        if (names.length === 0) {
          return reply(message, `Uso: \`${p}setFicha personajes Goku, Naruto, Luffy\``);
        }
        const added = [];
        const skipped = [];
        for (const name of names) {
          if (fichas.isTaken(guildId, name)) {
            skipped.push(name);
          } else {
            data.characters.push({ name });
            added.push(name);
          }
        }
        fichas.save();
        let text = `✅ Agregados (${added.length}): ${added.join(', ') || 'ninguno'}`;
        if (skipped.length) text += `\n⚠️ Ya estaban en la lista (${skipped.length}): ${skipped.join(', ')}`;
        return reply(message, text);
      }

      // !setFicha ver
      case 'ver': {
        const role = data.roleId ? message.guild.roles.cache.get(data.roleId) : null;
        let list = data.characters.map(c => c.name).join(', ') || 'Ninguno';
        if (list.length > 1500) list = list.slice(0, 1500) + '…';

        const embed = new EmbedBuilder()
          .setTitle('⚙️ Configuración de fichas')
          .setColor('#5865F2')
          .addFields(
            { name: 'Edad mínima', value: data.minAge ? String(data.minAge) : 'Desactivada', inline: true },
            { name: 'Rol de aprobado', value: role ? role.name : 'Sin configurar', inline: true },
            { name: `Personajes ocupados (${data.characters.length})`, value: list }
          );
        return message.reply({ embeds: [embed], allowedMentions: fichas.NO_PINGS });
      }

      default:
        return reply(
          message,
          'Uso:\n' +
          `\`${p}setFicha edad <número|off>\` → edad mínima (quien no la cumpla es expulsado)\n` +
          `\`${p}setFicha rol <@rol>\` → rol que se da al aprobar la ficha\n` +
          `\`${p}setFicha personajes <nombre1, nombre2, ...>\` → agrega personajes ocupados\n` +
          `\`${p}setFicha ver\` → muestra la configuración`
        );
    }
  },
};
