const { EmbedBuilder } = require('discord.js');
const state = require('../state');
const fichas = require('../fichas');

const ANSWER_TIME = 60_000;  // tiempo para responder cada pregunta
const active = new Set();    // "guildId:userId" con una ficha en proceso

// Envía al canal sin permitir @everyone ni roles (solo menciona al autor)
function say(message, content) {
  return message.channel.send({
    content,
    allowedMentions: { parse: [], users: [message.author.id] },
  });
}

// Hace una pregunta y espera la respuesta del mismo usuario.
// Devuelve el texto, o null si se acabó el tiempo o escribió "cancelar".
async function ask(message, question) {
  await say(message, `${message.author}, ${question}\n*(escribe \`cancelar\` para salir)*`);

  let collected;
  try {
    collected = await message.channel.awaitMessages({
      filter: m => m.author.id === message.author.id,
      max: 1,
      time: ANSWER_TIME,
      errors: ['time'],
    });
  } catch {
    await say(message, `⏰ ${message.author}, se acabó el tiempo. Usa \`${state.prefix}ficha\` para empezar de nuevo.`);
    return null;
  }

  const answer = collected.first().content.trim();
  if (answer.toLowerCase() === 'cancelar') {
    await say(message, '❌ Ficha cancelada.');
    return null;
  }
  return answer;
}

// Repite la pregunta hasta que la respuesta sea válida. validate -> { value } | { error }
async function askUntilValid(message, question, validate) {
  while (true) {
    const answer = await ask(message, question);
    if (answer === null) return null;
    const result = validate(answer);
    if (!result.error) return result.value;
    await say(message, `⚠️ ${result.error}`);
  }
}

// Edad por debajo del mínimo: avisa y expulsa (kick, no ban)
async function rejectUnderage(message, minAge) {
  const text = `para entrar a este team necesitas tener **${minAge} años o más**, así que serás expulsado del servidor.`;
  await say(message, `🚫 ${message.author}, ${text}`);
  await message.author
    .send(`🚫 Te informo que ${text.replace(/\*\*/g, '')} (Servidor: ${message.guild.name})`)
    .catch(() => {});

  const member = message.member;
  if (!member || !member.kickable) {
    return say(message, '⚠️ No pude expulsarlo: revisa que tenga el permiso **Expulsar miembros** y que mi rol esté por encima del suyo.');
  }
  try {
    await member.kick(`Ficha: no cumple la edad mínima (${minAge})`);
  } catch (err) {
    console.error('Error expulsando al usuario:', err);
    await say(message, '⚠️ Ocurrió un error al intentar expulsarlo.');
  }
}

module.exports = {
  name: 'ficha',
  async execute(message) {
    const guildId = message.guild.id;
    const data = fichas.getGuild(guildId);
    const key = `${guildId}:${message.author.id}`;

    const existing = fichas.findByUser(guildId, message.author.id);
    if (existing) {
      return message.reply({ content: `Ya tienes una ficha registrada con el personaje **${existing.name}**.`, allowedMentions: fichas.NO_PINGS });
    }
    if (active.has(key)) {
      return message.reply({ content: 'Ya tienes una ficha en proceso, termínala o escribe `cancelar`.', allowedMentions: fichas.NO_PINGS });
    }

    active.add(key);
    try {
      // 1) Personaje
      const name = await askUntilValid(message, '¿Cuál es el **nombre de tu personaje**?', (a) => {
        if (a.length > 50) return { error: 'El nombre es muy largo (máximo 50 caracteres).' };
        if (fichas.isTaken(guildId, a)) return { error: `**${a}** ya está usado. Escoge otro personaje.` };
        return { value: a };
      });
      if (name === null) return;

      // 2) Edad real
      const age = await askUntilValid(message, '¿Cuál es tu **edad real**? (solo el número)', (a) => {
        if (!/^\d{1,3}$/.test(a) || Number(a) < 1 || Number(a) > 120) {
          return { error: 'Escribe tu edad real solo con números, por ejemplo: `20`.' };
        }
        return { value: Number(a) };
      });
      if (age === null) return;

      if (data.minAge && age < data.minAge) {
        return rejectUnderage(message, data.minAge);
      }

      // 3) Fandom
      const fandom = await askUntilValid(message, '¿De qué **fandom** es tu personaje?', (a) => {
        if (a.length > 100) return { error: 'Es muy largo (máximo 100 caracteres).' };
        return { value: a };
      });
      if (fandom === null) return;

      // Revisión final: alguien pudo registrar el mismo personaje mientras respondías
      if (fichas.isTaken(guildId, name)) {
        return say(message, `⚠️ ${message.author}, justo alguien registró **${name}** mientras llenabas la ficha. Usa \`${state.prefix}ficha\` y escoge otro.`);
      }

      fichas.addCharacter(guildId, { name, userId: message.author.id, age, fandom });

      // Rol de aprobado
      let note = '';
      const role = data.roleId ? message.guild.roles.cache.get(data.roleId) : null;
      if (!role) {
        note = '\n⚠️ No hay un rol de aprobado configurado (el dueño debe usar `' + state.prefix + 'setFicha rol @rol`).';
      } else {
        try {
          await message.member.roles.add(role, 'Ficha aprobada');
        } catch (err) {
          console.error('Error dando el rol de aprobado:', err);
          note = '\n⚠️ No pude darte el rol: revisa que tenga **Gestionar roles** y que mi rol esté por encima de **' + role.name + '**.';
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Ficha aprobada')
        .setColor('#57F287')
        .addFields(
          { name: 'Personaje', value: name, inline: true },
          { name: 'Fandom', value: fandom, inline: true }
        )
        .setFooter({ text: message.author.username });

      await message.channel.send({
        content: `🎉 ¡Bienvenido al team, ${message.author}!${note}`,
        embeds: [embed],
        allowedMentions: { parse: [], users: [message.author.id] },
      });
    } finally {
      active.delete(key);
    }
  },
};
