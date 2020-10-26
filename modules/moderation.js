const Discord = require('discord.js');
const config = require('../config.js');
const datamanager = require('./datamanagement.js');

//set/query the server mod role
exports.setModRole = async (guild, roleMentions, member, args, bot) => {
    var currentModRole = await guild.roles.cache.get(await datamanager.getValue(guild.id, config.modRoleStorageChannel, bot));
    if (!currentModRole) { currentModRole = `nope` };
    if (!args[1]) return `This server's moderator role is \`${currentModRole.name}\``;
    else if (!member.hasPermission('ADMINISTRATOR')) return 'You must have the `Administrator` permission to set the moderator role.';
    else if (roleMentions.size === 1) {
        await datamanager.writeEntry(guild.id, roleMentions.first().id, config.modRoleStorageChannel, bot);
        return `Mod role set to \`${roleMentions.first().name}\``;
    }
    else if (guild.roles.cache.has(args[1])) {
        await datamanager.writeEntry(guild.id, args[1], config.modRoleStorageChannel, bot);
        return `Mod role set to \`${guild.roles.cache.get(args[1]).name}\``;
    }
    else return `Command usage: ${config.prefix}modrole [role mention/id]`
}

exports.queryModRole = async (guild, member, bot) => {
    var modRoleID = await datamanager.getValue(guild.id, config.modRoleStorageChannel, bot);
    if (modRoleID === null) return undefined;
    if (await member.roles.cache.find(role => role.id === modRoleID)) return true;
    else return false;
}

//set the server modlog channel
exports.modLog = async (guild, channel, member, bot, args) => {
    if (!member.hasPermission('ADMINISTRATOR')) return 'You must have the `Administrator` permission to set the modlog channel.';
    else if (args[1] === 'off') {
        await datamanager.deleteEntry(guild.id, config.modLogChannelsStorageChannel, bot);
        return `:white_check_mark: This server no longer has a modlog channel`;
    }
    else {
        await datamanager.writeEntry(guild.id, channel.id, config.modLogChannelsStorageChannel, bot);
        return `:white_check_mark: This is the new modlog channel.`;
    }
}

//take targets and the reason for a moderation action (durations included in reason)
exports.extractTargetsAndReason = async (message) => {
    var targets = []; //targets fetched from arguments
    var args = message.content.split(' ').slice(1);
    var targetsUntil; //so that the bot knows where to reason starts
    for (i = 0; i < args.length; i++) {
        if (args[i].startsWith('<@!') && args[i].endsWith('>') && !args[i].startsWith('<@&')) {
            let id = args[i]
            id = id.slice(2, -1);
            if (id.startsWith('!')) {
                id = id.slice(1);
            }
            if (!targets.includes(id)) {
                targets.push(id);
            }
            targetsUntil = i + 1;
        }
        else if (/^\d+$/.test(args[i]) && args[i].length > 11 && args[i].length < 30) {//ew regex
            let id = args[i];
            if (!targets.includes(id)) {
                targets.push(id);
            }

            targetsUntil = i + 1;
        }
        else break;
    }
    return { targets: targets, reason: args.slice(targetsUntil).join(' ') !== '' ? args.slice(targetsUntil).join(' ') : 'Unspecified' }
}

exports.modLogEvent = async (bot, guild, type, user, moderator, reason) => {
    var modlogChannel = bot.channels.cache.get(await datamanager.getValue(guild.id, config.modLogChannelsStorageChannel, bot));
    if (!modlogChannel) return 0;
    else {
        modlogChannel.send('If you can see this, something has gone wrong.').then(msg => {
            msg.edit(`**[${type}] ${user}**\nUser: ${user.tag}\nModerator: ${moderator.tag}\nReason: ${reason === 'Unspecified' ? `Responsible moderator, do \`${config.prefix}reason ${msg.id}\` to set` : reason}`);
        })
    }
}

exports.setReason = async (guild, member, message, bot) => {
    var outputMessage = '';
    var modlogChannel = bot.channels.cache.get(await datamanager.getValue(guild.id, config.modLogChannelsStorageChannel, bot));
    var roleQuery = await exports.queryModRole(guild, member, bot);
    if (roleQuery === false && !member.hasPermission('ADMINISTRATOR')) return `Only moderators can execute this command.`;
    else {
        var toChange = await exports.extractTargetsAndReason(message);

        if (toChange.targets.length > 10) return `You may only set 10 reasons at once`;
        if (toChange.targets.length === 0 || toChange.reason === 'Unspecified') return `Command usage: ${config.prefix}reason <logIDs> <reason>`;
        if (toChange.reason.length > 1000) return `The reason must not exceed 1000 characters. Currently, it is ${toChange.reason.length}.`;

        for (i = 0; i < toChange.targets.length; i++) {
            await modlogChannel.messages.fetch(toChange.targets[i])
                .then(async msg => {
                    var contentSections = msg.content.split('\n');
                    var withoutReason = `${contentSections[0]}\n${contentSections[1]}\n${contentSections[2]}\n`;

                    await msg.edit(`${withoutReason}Reason: ${toChange.reason} (Set by ${member.user.tag})`).then(edit => {
                        outputMessage += `Successfully updated reason for \`${edit.id}\`\n`;
                    }).catch(err => {
                        outputMessage += `Failed to updated reason for \`${toChange.targets[i]}\`: Unable to edit that message.\n`;
                    })
                })
                .catch(err => {
                    outputMessage += `Failed to updated reason for \`${toChange.targets[i]}\`: Unable to find that message.\n`;
                })
        }

        return outputMessage;



    }
}

exports.kick = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}kick <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('KICK_MEMBERS')) return `I require the \`Kick Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only kick 10 members at a time.`;
    else if (reason.length > 1000) return `The kick reason must not exceed 1000 characters. Currently, it is ${reason.length}.`;
    for (let i = 0; i < targets.length; i++) {
        let targetMember = guild.member(targets[i]);
        if (targetMember) {
            if (targetMember.kickable) {
                let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR')) && !member.hasPermission('ADMINISTRATOR')) {
                    outputMessage += `Unable to kick \`${targetMember.user.tag}\`: Only administrators can kick people with the moderator role and/or admin perms.\n`
                } else {
                    await targetMember.user.send(`You were kicked from ${targetMember.guild.name} by ${member.user.tag}.\nReason: \`${reason}\``).catch(err => { });
                    await targetMember.kick(`[${member.user.tag}] ${reason}`);
                    exports.modLogEvent(bot, guild, `KICK`, targetMember.user, member.user, reason);

                    outputMessage += `Successfully kicked \`${targetMember.user.tag}\`\n`;
                }
            } else {
                outputMessage += `Unable to kick \`${targetMember.user.tag}\`: I don't have permission to kick them.\n`;
            }
        } else {
            outputMessage += `Unable to kick \`${targets[i]}\`: They don't seem to be in this server.\n`;
        }
    }
    outputMessage += `**Kick Reason:**\n\`${reason}\``;
    return outputMessage;
}

exports.ban = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}ban <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('BAN_MEMBERS')) return `I require the \`Ban Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only ban 10 members at a time.`;
    else if (reason.length > 1000) return `The ban reason must not exceed 1000 characters. Currently, it is ${reason.length}.`;
    for (let i = 0; i < targets.length; i++) {
        let targetMember = guild.member(targets[i]);
        if (targetMember) {
            if (targetMember.bannable) {
                let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR')) && !member.hasPermission('ADMINISTRATOR')) {
                    outputMessage += `Unable to ban \`${targetMember.user.tag}\`: Only administrators can ban people with the moderator role and/or admin perms.\n`
                } else {
                    await targetMember.user.send(`You were banned from ${targetMember.guild.name} by ${member.user.tag}.\nReason: \`${reason}\``).catch(err => { });
                    await targetMember.ban({ reason: `[${member.user.tag}] ${reason}` });
                    exports.modLogEvent(bot, guild, `BAN`, targetMember.user, member.user, reason);

                    outputMessage += `Successfully banned \`${targetMember.user.tag}\`\n`;
                }
            } else {
                outputMessage += `Unable to ban \`${targetMember.user.tag}\`: I don't have permission to ban them.\n`;
            }
        } else {
            await guild.members.ban(targets[i], { reason: `[${member.user.tag}] ${reason}` })
                .then(banned => {
                    exports.modLogEvent(bot, guild, `BAN`, banned, member.user, reason);
                    outputMessage += `Successfully banned \`${banned.tag}\`\n`;
                })
                .catch(err => {
                    outputMessage += `Unable to ban \`${targets[i]}\`. Check that you have the correct user ID and that they aren't already banned.\n`;
                })

        }
    }
    outputMessage += `**Ban Reason:**\n\`${reason}\``;
    return outputMessage;
}