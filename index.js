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
const supportServer = require('./modules/supportserverprocesses.js');
const errorHandler = require('./modules/errorhandling.js');

//configure a web app, so that the repl can be kept alive
const express = require('express');
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send("e"));

app.listen(port, () => console.log(`web app listening at http://localhost:${port}`));

//execute when the application has logged in
bot.on('ready', () => {
    console.log('bot is online');
    supportServer.runProcesses(bot);
})

bot.on('message', async message => {
    //command handler
    if (!message.content.startsWith(config.prefix)) return 0;
    let args = message.content.substring(config.prefix.length).split(' ');
    try {
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
                return; //might be used later
                message.reply('fetching all messages in this channel, this may take some time');
                let results = await dataManager.fetchAllChannelMessages(message.channel);
                results = results.reverse();
                message.reply(`fetch complete. ${results.length} messages were fetched`)
                for (i = 0; i < results.length; i++) {
                    console.log(`${results[i].author.tag}: ${results[i].content}`)
                }
                break;
            case 'support':
                message.author.send(config.supportServerInviteLink);
                message.react('✅');
                break;
            case 'fetcherror':
                if (message.author.id === config.owner) {
                    message.channel.send(await errorHandler.fetchError(args[1], bot));
                }
                break;
            case 'serverinfo':
                message.channel.send(await misc.serverInfo(message.guild));
                break;
            case 'clear':
                await misc.clear(message.channel, message.member, args[1])
                break;
            case 'invite':
                message.author.send(main.invite());
                message.react('✅');
                break;
        }
    } catch (err) {
        message.channel.send(await errorHandler.reportError(err, message.content, bot));
    }
})