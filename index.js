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

//Import Module Files
const main = require('./Modules/Main/index.js');

bot.on('ready', () => {
    console.log('bot is online');
})

bot.on('message', message => {
    if(!message.content.startsWith(config.prefix)) return 0;
    let args = message.content.substring(config.prefix.length).split(' ');
    switch(args[0]){
        case 'changelog':
            message.channel.send(main.changelog());
            break;
    }
})