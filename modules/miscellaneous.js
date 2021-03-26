const config = require('../config.js');
const Discord = require('discord.js');
const dataManager = require('./datamanagement.js');
var snipes = {};

//poll command
//note: sending messages directly from function because it needs to add reactions.
exports.poll = (args, message) => {
    if (!args[1]) return message.channel.send(`Command usage: ${config.prefix}poll <Question> [options split with a newline]`);
    if (args.slice(1).join(' ').split('\n').length <= 1) {
        let question = args.slice(1).join(' ');
        message.delete({ timeout: 1 });
        const poll = new Discord.MessageEmbed()
            .setColor(config.embedColour)
            .setTitle('Poll!')
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
        if (pollArgs.length > 11) { message.channel.send('You may only have ten options'); return 0; }
        message.delete({ timeout: 1 });
        let options = '\n\nChoices:\n\n';
        for (i = 1; i < pollArgs.length; i++) {
            options += numberReactions[i] + ' ' + pollArgs[i] + '\n';
        }
        const MCPoll = new Discord.MessageEmbed()
            .setColor(config.embedColour)
            .setTitle('Poll!')
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
    if (!amount) return channel.send(`Command usage: ${config.prefix}clear <number of messages/message ID to clear up to>`)
    if (!member.hasPermission('ADMINISTRATOR')) return channel.send('You must have the `Administrator` permission to execute this command.');
    if (!channel.guild.me.hasPermission('MANAGE_MESSAGES')) return channel.send('I need the `Manage Messages` permission to execute this command.');

    amount = parseInt(amount); //parse amount as an integer
    if (amount > 999999999) { //probably not a way for checking if something is a snowflake but who cares
        let messageArray = await fetchAllChannelMessages(channel, 100)
        var foundMessage = false;
        for (let i in messageArray) {
            if(parseInt(messageArray[i].id) === amount) {
                amount = parseInt(i)
                foundMessage = true;
            }
            
        }
        if(!foundMessage) return channel.send('Unable to find that message, make sure it\'s in the 100 most recent messages')
    }

    //ensure that the user is not trying to clear more than 100 messages
    if (amount > 99) return channel.send(':x: You may not clear more than 99 messages at once');

    let toRemove = await fetchAllChannelMessages(channel, 150);

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

async function fetchAllChannelMessages(channel, limit) {
    if (!limit) { limit = 12000; }//to prevent api spam and such, defaults to 12000
    var sum_messages = [];
    let last_id;
    while (true) {
        var options = { limit: 100 }
        if (last_id) {
            options.before = last_id;
        }
        var messages = await channel.messages.fetch(options);
        sum_messages.push(...messages.array());
        last_id = messages.last().id;

        if (messages.size != options.limit || sum_messages.length >= limit) {
            break;
        }
    }

    return sum_messages;//returns an array;

}

exports.remind = async (args, user) => {
    if (args.length < 3) return `Command usage: ${config.prefix}remind <time> <message>`
    const timeConvert = require('./timeconvert');
    time = await timeConvert(args[1], { convertTo: 'ms' })
    if (!parseInt(time)) return `That doesn't look like a valid time`;
    await dataManager.writeData('reminders', { user: user.id, reminder: args.slice(2).join(' '), time: Date.now() + time }, { user: user.id, reminder: args.slice(2).join(' '), time: Date.now() + time })
    return `I'll remind you in ${await timeConvert(args[1], { convertTo: 'long' })}:\n${args.slice(2).join(' ')}`;
}

//snipe
exports.onMessageDelete = (msg) => {
    snipes[msg.channel.id] = {
        content: msg.content,
        author: msg.author.id,
        timestamp: msg.createdTimestamp
    }
}

exports.snipe = async (msg, client) => {
    if(snipes[msg.channel.id]) {
        const author = await client.users.fetch(snipes[msg.channel.id].author);
        const resultEmbed = new Discord.MessageEmbed()
            .setDescription(snipes[msg.channel.id].content)
            .setAuthor(`Sniped by ${msg.author.tag}`, msg.author.avatarURL())
            .addField("Author", author)
            .setColor(config.embedColour)
            .setTimestamp(new Date(snipes[msg.channel.id].timestamp))
            msg.channel.send(resultEmbed)
    } else {
        msg.channel.send("No recently deleted messages found in this channel.");
    }
}