//important stuff
const Discord = require('discord.js');
const config = require('../config.js');
const fs = require('fs');

//changelog command
exports.changelog = () => {
    const changelog = fs.readFileSync('./changelog.txt');
    return `\`\`\`\n${changelog}\n\`\`\``;
}

//help command
exports.help = () => {
    const help = new Discord.MessageEmbed()
        .setTitle('Omega Help Menu')
        .setColor(config.embedColour)
        .setDescription(`Prefix: ${config.prefix}`)
        .addField('Main Module', `Changelog - Prints the bot's most recent changelog\nHelp - Prints help info\nPing - Returns client latency\nSupport - Sends an invite to my support server`)
        .addField('Miscellaneous Module', `Poll <question> [options split with a newline] - Creates a poll.`)
    return help;
}

//ping command
exports.ping = (bot) => {
    return `Pong! Latency is ${bot.ws.ping}ms.`;
}