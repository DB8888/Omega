const config = require('../config.js');
const Discord = require('discord.js');

//poll command
//note: sending messages directly from function because it needs to add reactions.
exports.poll = (args, message) => {
    if (!args[1]) return message.channel.send(`To create a new poll, do ${config.prefix}poll <Question> [options split with a newline]`);
    if (args.slice(1).join(' ').split('\n').length <= 1) {
        let question = args.slice(1).join(' ');
        message.delete({ timeout: 1 });
        const poll = new Discord.MessageEmbed()
            .setColor(config.embedColour)
            .setTitle('New Poll!')
            .setDescription(`**${question}**\n\nTo vote yes, react with ✅\nTo vote no, react with ❌\nIf you really don't care, react with 🤷`)
            .setFooter(`Poll created by ${message.author.tag}`)
        message.channel.send(poll).then(messageReaction => {
            messageReaction.react('✅');
            messageReaction.react('❌');
            messageReaction.react('🤷');
        });
    }else{//multiple choice poll
        let numberReactions = ["","1️⃣","2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣","🔟"];
        let pollArgs = args.slice(1).join(' ').split('\n');
        if(pollArgs.length > 11){message.channel.send('You may only choose nine options'); return 0;}
        message.delete({ timeout: 1});
        let options = '\n\nChoices:\n\n';
        for(i = 1; i < pollArgs.length; i++){
            options += numberReactions[i] +' ' + pollArgs[i] + '\n';
        }
        const MCPoll = new Discord.MessageEmbed()
        .setColor(config.embedColour)
        .setTitle('New Poll!')
        .setDescription(`**${pollArgs[0]}** ${options}`)
        .setFooter(`Poll created by ${message.author.tag}`)
        message.channel.send(MCPoll).then(messageReaction =>{
            for(i = 1; i < pollArgs.length; i++){
                messageReaction.react(numberReactions[i]);
            }
        })
    }
}