const Discord = require('discord.js');
const config = require('../config.js');

//Support server tasks, to be executed periodically
exports.runProcesses = (bot) => {
    setTimeout(function () {
        bot.channels.cache.get(config.supportServerMemberCountChannel).setName(`${bot.guilds.cache.get(config.supportServer).members.cache.size} Support Server Members`);
        bot.channels.cache.get(config.supportServerUserCountChannel).setName(`${bot.users.cache.size} Users`);
        bot.channels.cache.get(config.supportServerGuildCountChannel).setName(`${bot.guilds.cache.size} Servers`);


        exports.runProcesses(bot);
    }, 600000);
}