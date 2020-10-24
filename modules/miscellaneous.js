const config = require('../config.js');
const Discord = require('discord.js');
const dataManager = require('./datamanagement.js');

//poll command
//note: sending messages directly from function because it needs to add reactions.
exports.poll = (args, message) => {
    if (!args[1]) return message.channel.send(`Command usage: ${config.prefix}poll <Question> [options split with a newline]`);
    if (args.slice(1).join(' ').split('\n').length <= 1) {
        let question = args.slice(1).join(' ');
        message.delete({ timeout: 1 });
        const poll = new Discord.MessageEmbed()
            .setColor(config.embedColour)
            .setTitle('New Poll!')
            .setDescription(`**${question}**\n\nTo vote yes, react with ✅\nTo vote no, react with ❌\nIf you are unsure/don't care, react with 🤷`)
            .setFooter(`Poll created by ${message.author.tag}`)
        message.channel.send(poll).then(messageReaction => {
            messageReaction.react('✅');
            messageReaction.react('❌');
            messageReaction.react('🤷');
        });
    } else {//multiple choice poll
        let numberReactions = ["", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        let pollArgs = args.slice(1).join(' ').split('\n');
        if (pollArgs.length > 11) { message.channel.send('You may only have nine options'); return 0; }
        message.delete({ timeout: 1 });
        let options = '\n\nChoices:\n\n';
        for (i = 1; i < pollArgs.length; i++) {
            options += numberReactions[i] + ' ' + pollArgs[i] + '\n';
        }
        const MCPoll = new Discord.MessageEmbed()
            .setColor(config.embedColour)
            .setTitle('New Poll!')
            .setDescription(`**${pollArgs[0]}** ${options}`)
            .setFooter(`Poll created by ${message.author.tag}`)
        message.channel.send(MCPoll).then(messageReaction => {
            for (i = 1; i < pollArgs.length; i++) {
                messageReaction.react(numberReactions[i]);
            }
        })
    }
}

//server info command
exports.serverInfo = async (guild) => {
    const info = new Discord.MessageEmbed()
        .setColor(config.embedColour)
        .setTitle('Server Info')
        .setThumbnail(guild.iconURL())
        .addField('Name', guild.name, true)
        .addField('Members', guild.members.cache.size, true)
        .addField('Channels', guild.channels.cache.size, true)
        .addField('Roles', guild.roles.cache.size, true)
        .addField('Owner', guild.owner.user.tag, true)
        .addField('ID', guild.id, true)
    return info;
}

//command to clear messages in a channel
exports.clear = async (channel, member, amount) => {
    //check if perms are in order
    if (!amount) return channel.send(`Command usage: ${config.prefix}clear <number of messages>`)
    if (!member.hasPermission('ADMINISTRATOR')) return channel.send('You must have the `Administrator` permission to execute this command.');
    if (!channel.guild.me.hasPermission('MANAGE_MESSAGES')) return channel.send('I need the `Manage Messages` permission to execute this command.');

    amount = parseInt(amount); //parse amount as an integer

    //ensure that the user is not trying to clear more than 100 messages
    if (amount > 99) return channel.send(':x: You may not clear more than 99 messages at once');

    let toRemove = await dataManager.fetchAllChannelMessages(channel, 150);

    if (toRemove[amount] === undefined) {
        amount = toRemove.length - 1;
    }

    if (toRemove[amount].createdTimestamp < (Date.now() - 1209600000)) return channel.send(':x: Cannot clear messages older than 14 days (Discord API Limitation)');

    await channel.bulkDelete(amount + 1);

    channel.send(`:white_check_mark: Successfully cleared ${amount} messages.`).then(msg => {
        setTimeout(function () {
            msg.delete();
        }, 3000)
    })
}