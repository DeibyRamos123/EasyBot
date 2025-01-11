const {Client, Events, GatewayIntentBits} = require('discord.js');
const { distoken } = require('./config.json');
const { EmbedBuilder } = require('discord.js');


const axios = require('axios');
const fs = require('fs');


let prefix = '!';


// comando con prefijo 
let customCommands = [];
let customEmbeds = [];

try {
    const data = fs.readFileSync('./embeds.json', 'utf8');
    const parseData = JSON.parse(data);
    customEmbeds = parseData.customEmbed || [];
    console.log('Custom embeds loaded:', customEmbeds);
}catch (err) {
    console.error('Error reading file from commands.json:', err);
}

try {
    const data = fs.readFileSync('./commands.json', 'utf8');
    const parseData = JSON.parse(data);
    customCommands = parseData.customCommands || [];
    console.log('Custom commands loaded:', customCommands);
} catch (err) {
    console.error('Error reading file from commands.json:', err);
}

const addCustomCommand = (command, response) => {
    customCommands.push({command, response});
    fs.writeFileSync('./commands.json', JSON.stringify(customCommands), 'utf8');
}



const client = new Client({
    intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
    ],
});



client.once('ready', () => {
    console.log('Bot is running as ' + client.user.tag);
});


client.on(Events.MessageCreate, async message => {
    if(message.content.startsWith(prefix)){
        const command = message.content.slice(prefix.length).split(' ')[0];
        console.log(command);
        if(command == 'setprefix') {
            newPrefix = message.content.slice(prefix.length).split(' ')[1];
            prefix = newPrefix;
            message.reply(`set prefix to: ${prefix}`);
        } else if (command == 'prefix'){
            message.reply(`Prefix is: ${prefix}`);
        }  else  {

            const customCommand = customCommands.find(c => c.command == command);
            if(customCommand){
                message.reply(customCommand.response);
                return;
            }

            const customCommandEmbed = customEmbeds.find(c => c.command == command);
            if (customCommandEmbed){
                const embed = new EmbedBuilder()
                .setTitle(customCommandEmbed.title ? customCommandEmbed.title : `Error: The **title**, **description** and **color** is required`)
                .setDescription(customCommandEmbed.description ? customCommandEmbed.description : `Error: The **title**, **description** and **color** is required`)
                .setThumbnail(customCommandEmbed.thumbnail || null)
                .setImage(customCommandEmbed.image || null)
                .setColor(
                    customCommandEmbed.embedColor.startsWith('0x')
                        ? parseInt(customCommandEmbed.embedColor, 16)
                        : customCommandEmbed.embedColor
                )

                customCommandEmbed.author ? console.log(customCommandEmbed.author) : console.log(`isn't an author here`);

                if(customCommandEmbed.author){
                    const autName = message.author.username;
                    const autAvatar = message.author.displayAvatarURL({ dynamic: true});

                    embed.setAuthor({
                        name: autName || '',
                        iconURL: autAvatar || null,
                        url:`https://discord.com/users/${message.author.id}` || null
                    });
                } else {
                    console.log('the author is disabled')
                }

                await message.channel.send({embeds: [embed]});
            }
        }
    }
});

client.login(distoken);