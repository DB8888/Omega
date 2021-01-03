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
const supportServer = require('./modules/supportserverprocesses.js');
const errorHandler = require('./modules/errorhandling.js');
const moderation = require('./modules/moderation.js');
const ownercommands = require('./modules/ownercommands.js');

//configure a web app, so that the repl can be kept alive
const express = require('express');
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send("e"));

app.listen(port, () => console.log(`web app listening at http://localhost:${port}`));

//configure mongodb
const mongo = require('./modules/mongo');
mongo()

//configure timed actions
const timedActions = require('./modules/timedactions');


//execute when the application has logged in
bot.on('ready', () => {
    console.log('bot is online');
    bot.channels.cache.get(config.startupLoggingChannel).send(':white_check_mark: Omega has started');
    supportServer.runProcesses(bot);
    timedActions(bot);
})

bot.on('message', async message => {
    if (message.channel.type === 'dm') {
        bot.channels.cache.get(config.DMLoggingChannel).send(`${message.author}: ${message.content}`);
    }
    if (message.author.bot) return 0;
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
                main.ping(message);
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
            case 'modrole':
                message.channel.send(await moderation.setModRole(message.guild, message.mentions.roles, message.member, args, bot));
                break;
            case 'modlog':
                message.channel.send(await moderation.modLog(message.guild, message.channel, message.member, bot, args))
                break;
            case 'kick':
                var kick = await moderation.extractTargetsAndReason(message)
                message.channel.send(await moderation.kick(message.guild, kick.targets, message.member, kick.reason, bot));
                break;
            case 'ban':
                var ban = await moderation.extractTargetsAndReason(message)
                message.channel.send(await moderation.ban(message.guild, ban.targets, message.member, ban.reason, bot));
                break;
            case 'unban':
                var unban = await moderation.extractTargetsAndReason(message)
                message.channel.send(await moderation.unban(message.guild, unban.targets, message.member, unban.reason, bot));
                break;
            case 'reason':
                message.channel.send(await moderation.setReason(message.guild, message.member, message, bot));
                break;
            case 'listservers':
                ownercommands.listServers(message.author, bot, message.channel);
                break;
            case 'eval':
                ownercommands.eval(message.author, bot, message, args);
                break;
            case 'restart':
                ownercommands.restart(message.author, message, bot);
                break;
            case 'announce':
                ownercommands.announce(args.slice(1).join(' '), bot);
                message.react('✅');
                break;
            case 'remind':
                message.channel.send(await misc.remind(args, message.author));
                break;
        }
        log(message.guild, message.content, message.author, message.channel)
    } catch (err) {
        message.channel.send(await errorHandler.reportError(err, message.content, bot));
        console.log(err);
    }
})
if (process.env.TEST != 1) {
    bot.on('guildBanAdd', async (guild, user) => {//execute when someone is banned, to catch bans not made by the bot
        var moderator;
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_ADD'
        })

        const banLog = fetchedLogs.entries.first();

        if (!banLog) {
            moderator = { tag: 'Unknown' }//adding tag property because this is how the modlog function gets the mod's info
        }

        const { executor, target } = banLog;

        moderator = executor;

        if (target.id === user.id && banLog.createdTimestamp > Date.now() - 5000) {
            if (moderator === bot.user) return 0;
            moderation.modLogEvent(bot, guild, 'BAN', user, moderator, banLog.reason ? banLog.reason : 'Unspecified');
        } else {
            guild.fetchBans().then(bans => {
                var reason = bans.get(user.id).reason
                moderator = { tag: 'Unknown' }
                moderation.modLogEvent(bot, guild, 'BAN', user, moderator, reason ? reason : 'Unspecified');
            })
        }
    })

    bot.on('guildBanRemove', async (guild, user) => {//execute when someone is unbanned, to catch bans not made by the bot
        var moderator;
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_REMOVE'
        })

        const unbanLog = fetchedLogs.entries.first();

        if (!unbanLog) {
            moderator = { tag: 'Unknown' }//adding tag property because this is how the modlog function gets the mod's info
        }

        const { executor, target } = unbanLog;

        moderator = executor;
        if (target.id === user.id && unbanLog.createdTimestamp > Date.now() - 5000) {
            if (moderator === bot.user) return 0;
            moderation.modLogEvent(bot, guild, 'UNBAN', user, moderator, unbanLog.reason ? unbanLog.reason : 'Unspecified');
        } else {
            moderation.modLogEvent(bot, guild, 'UNBAN', user, { tag: 'Unknown' }, 'Unspecified');
        }
    })

    bot.on('guildMemberRemove', async member => {//check if a user was kicked
        const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_KICK',
        });

        const kickLog = fetchedLogs.entries.first();


        if (!kickLog) return 0;

        const { executor, target } = kickLog;


        if (target.id === user.id && kickLog.createdTimestamp > Date.now() - 5000) {
            if (executor === bot.user) return 0;
            let user = member.user;
            moderation.modLogEvent(bot, member.guild, 'KICK', user, executor, kickLog.reason ? kickLog.reason : 'Unspecified');
        }
    });
}
    async function log(server, command, user, channel) {
        bot.channels.cache.get(config.commandLoggingChannel).send(`\`\`\`\n${user.tag}, ${channel}, ${server.name}: ${command}\`\`\``)
    }
