const Discord = require('discord.js');
const config = require('../config.js');

exports.listServers = async (executor, bot, channel) => {
    if (executor.id != config.owner) return 0;
    bot.guilds.cache.forEach(async g => {
        await channel.send(`Name: ${g.name}\nOwner: ${g.owner.user.tag}\nMembers: ${g.members.cache.size}`);
    })
}

exports.eval = async (executor, bot, message, args) => {
    if (executor.id != config.owner) return 0;
    let evaled;
    try {
        evaled = eval(args.slice(1).join(' '));
    } catch (error) {
        message.channel.send(`ERROR: \`\`\`\n${error}\n\`\`\``)
    }
    message.channel.send(`\`\`\`\n${evaled}\n\`\`\``);
}

exports.restart = async (executor, message) => {
    if (executor.id != config.owner) return 0;
    await message.channel.send('Restarting...');
    process.exit();
}