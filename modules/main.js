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
        .setDescription(`Prefix: ${config.prefix}\nGot an issue? Join our [Support Server](${config.supportServerInviteLink})`)
        .addField('Main Module', `Changelog - Prints the bot's most recent changelog\nHelp - Prints help info\nPing - Returns client latency\nSupport - Sends an invite to my support server\nInvite - Sends a link to invite Omega to your server`)
        .addField('Miscellaneous Module', `Poll <question> [options split with a newline] - Creates a poll\nServerinfo - Returns basic server info\nClear <# of messages> - Clear a certain number of messages in a channel.`)
        .addField('Moderation Module', `Modrole [Role Mention/ID|off] - Allows a certain role to use moderator commands, even if they don't have moderator permissions\nModlog [off] - Sets/unsets a channel to log moderator actions.\nReason <Modlog Message IDs> <reason> - Allows the changing of the reason for 1 or more previous moderator actions in the mod logs\nKick <userIDs/mentions> [reason] - Kicks members from the server\nBan <userIDs/mentions> [reason] - Bans members from the server\nUnban <userIDs/mentions> [reason] - Unbans members from the server`)
    return help;
}

//ping command
exports.ping = (message) => {
    message.channel.send('Pong!').then(msg => {
        let responseTime = msg.createdTimestamp - message.createdTimestamp;
        msg.edit(`Pong! \`${responseTime}ms\``);
    })
}

exports.invite = () => {
    return `Invite me to your server at\n${config.botInviteLink}`;
}