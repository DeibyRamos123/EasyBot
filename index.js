const { Client, Events, GatewayIntentBits } = require('discord.js');
const { distoken } = require('./config.json');
const { loadBotData } = require('./storage');
const onMessageCreate = require('./handlers/messageCreate');

// NOTA: @discordjs/voice (a través de prism-media) NO usa la variable FFMPEG_PATH.
// Solo detecta ffmpeg si: (1) el paquete ffmpeg-static funciona, o (2) el comando
// "ffmpeg" está en el PATH del sistema operativo.

// (OPCIONAL) Si YouTube falla seguido con "Invalid URL", descomenta y pon tu cookie:
// require('@iamtraction/play-dl').setToken({ youtube: { cookie: 'TU_COOKIE_AQUI' } });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Bot running as ${client.user.tag}`);
});

client.on(Events.MessageCreate, onMessageCreate);

loadBotData().then(() => client.login(distoken));
