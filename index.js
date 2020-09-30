/*
Omega
Author: DintyB
*/

//Configure environment variables
require('dotenv').config();
const token = process.env.TOKEN;

//configure Discord API
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.login(token);

//import config
const config = require('./config.js');

//Import Modules
const main = require('./modules/main.js');
const misc = require('./modules/miscellaneous.js');
const dataManager = require('./modules/datamanagement.js');

bot.on('ready', () => {
    console.log('bot is online');
})

bot.on('message', message => {
    //command handler
    if (!message.content.startsWith(config.prefix)) return 0;
    let args = message.content.substring(config.prefix.length).split(' ');
    switch (args[0].toLowerCase()) {
        case 'changelog':
            message.channel.send(main.changelog());
            break;
        case 'help':
            message.channel.send(main.help());
            break;
        case 'poll':
            misc.poll(args, message); //note: sending messages directly from function because it needs to add reactions.
            break;
        case 'ping':
            message.channel.send(main.ping(bot));
    }
})

//execute when the bot is added to a guild
bot.on('guildCreate', guild => {

})