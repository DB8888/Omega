const config = require('../config.js');
const Discord = require('discord.js')

exports.eval = async (executor, bot, message, args) => {
    if (executor.id != config.owner) return message.channel.send('no');
    let evaled;
    try {
        evaled = await eval(args.slice(1).join(' '));
    } catch (error) {
        message.channel.send(`ERROR: \`\`\`\n${error}\n\`\`\``)
    }
    message.channel.send(`\`\`\`\n${evaled}\n\`\`\``);
}

exports.restart = async (executor, message, bot) => {
    if (executor.id != config.owner) return 0;
    await message.channel.send('Restarting...');
    await bot.destroy();
    process.exit();
}

exports.announce = async (message, bot) => {
    bot.channels.cache.get(config.supportServerAnnouncementChannel).send(message).then(msg => {
        //msg.crosspost();
    })
}