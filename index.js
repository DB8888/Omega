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
    /*bot.channels.cache.get(config.storageChannel).messages.fetch({limit: 100}).then(messages=> {
        console.log(messages.filter(m => m.content === 'e').first().author.tag);
    })*/
})

bot.on('message',async message => {
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
            break;
        case 'fetch':
            message.reply('fetching all messages in this channel, this may take some time');
            let results = await dataManager.fetchAllChannelMessages(message.channel);
            results = results.reverse();
            message.reply(`fetch complete. ${results.length} messages were fetched`)
            for(i = 0; i < results.length; i++){
                console.log(`${results[i].author.tag}: ${results[i].content}`)
            }
            break;
    }
})
