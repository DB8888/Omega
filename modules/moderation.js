const config = require('../config.js');
const datamanager = require('./datamanagement.js');
const Discord = require('discord.js')

//set/query the server mod role
exports.setModRole = async (guild, roleMentions, member, args, bot) => {
    if (!args[1]) {
        var currentModRoleData = await datamanager.fetchData('modRoles', { guild: guild.id });
        var currentModRole;
        if (!currentModRoleData[0]) {
            currentModRole = { name: undefined }
        } else {
            currentModRole = await guild.roles.cache.get(currentModRoleData[0].role)
        }
        return `This server's moderator role is \`${currentModRole.name}\``;
    }
    else if (!member.hasPermission('ADMINISTRATOR')) return 'You must have the `Administrator` permission to set the moderator role.';
    else if (roleMentions.size === 1) {
        await datamanager.writeData('modRoles', { guild: guild.id, role: roleMentions.first().id }, { guild: guild.id })
        return `Mod role set to \`${roleMentions.first().name}\``;
    }
    else if (guild.roles.cache.has(args[1])) {
        await datamanager.writeData('modRoles', { guild: guild.id, role: args[1] }, { guild: guild.id })
        return `Mod role set to \`${guild.roles.cache.get(args[1]).name}\``;
    }
    else if (args[1] === 'off') {
        await datamanager.deleteData('modRoles', { guild: guild.id })
        return `This server no longer has a mod role`
    }
    else return `Command usage: ${config.prefix}modrole [role mention/id]`
}

exports.queryModRole = async (guild, member, bot) => {
    var modRoleData = await datamanager.fetchData('modRoles', { guild: guild.id });
    var modRoleID = modRoleData[0] ? modRoleData[0].role : null;
    if (modRoleID === null) return false;
    if (await member.roles.cache.find(role => role.id === modRoleID)) return true;
    else return false;
}

//set the server modlog channel
exports.modLog = async (guild, channel, member, bot, args) => {
    if (!guild.me.hasPermission('VIEW_AUDIT_LOG')) return `I require the \`View Audit Log\` permission to execute this command.`;
    if (!member.hasPermission('ADMINISTRATOR')) return 'You must have the `Administrator` permission to set the modlog channel.';
    else if (args[1] === 'off') {
        await datamanager.deleteData('modLog', { guild: guild.id })
        return `:white_check_mark: This server no longer has a modlog channel`;
    }
    else {
        await datamanager.writeData('modLog', { guild: guild.id, channel: channel.id }, { guild: guild.id })
        return `:white_check_mark: This is the new modlog channel.`;
    }
}

//take targets and the reason for a moderation action (durations included in reason)
exports.extractTargetsAndReason = async (message) => {
    var targets = []; //targets fetched from arguments
    var args = message.content.split(' ').slice(1);
    var targetsUntil; //so that the bot knows where the reason starts
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
    var rawData = await datamanager.fetchData('modLog', { guild: guild.id });
    var modlogChannelID = rawData[0] ? rawData[0].channel : false;
    var modlogChannel = modlogChannelID ? bot.channels.cache.get(modlogChannelID) : false;
    if (!modlogChannel) return 0;
    else {
        const log = new Discord.MessageEmbed()
            .setTitle(type)
            .setTimestamp()
            .addFields(
                { name: 'User', value: `${user.tag} (${user})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag} (${moderator.tag === 'Unknown' ? '?' : moderator})`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setColor(config.modLogEmbedColours[type])
        modlogChannel.send(log).then(msg => {
            if (reason === 'Unspecified') {
                const edit = new Discord.MessageEmbed()
                    .setTitle(type)
                    .setTimestamp()
                    .addFields(
                        { name: 'User', value: `${user.tag} (${user})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator})`, inline: true },
                        { name: 'Reason', value: reason === 'Unspecified' ? `Responsible moderator, do \`${config.prefix}reason ${msg.id}\` to set` : reason }
                    )
                    .setColor(config.modLogEmbedColours[type])
                msg.edit(edit)
            }
        }).catch(err => {})//in case channel is deleted or unable to send for some reason
    }
}

exports.setReason = async (guild, member, message, bot) => {
    var outputMessage = '';
    var rawData = await datamanager.fetchData('modLog', { guild: guild.id });
    var modlogChannelID = rawData[0] ? rawData[0].channel : false;
    var modlogChannel = modlogChannelID ? bot.channels.cache.get(modlogChannelID) : false;
    if (!modlogChannel) return message.channel.send(`This server doesn't have a modlog channel`);
    var roleQuery = await exports.queryModRole(guild, member, bot);
    if (roleQuery === false && !(member.hasPermission('ADMINISTRATOR') || member.hasPermission('BAN_MEMBERS') || member.hasPermission('KICK_MEMBERS'))) return `Only moderators can execute this command.`;
    else {
        var toChange = await exports.extractTargetsAndReason(message);

        if (toChange.targets.length > 10) return `You may only set 10 reasons at once`;
        if (toChange.targets.length === 0 || toChange.reason === 'Unspecified') return `Command usage: ${config.prefix}reason <Modlog Message IDs> <reason>`;
        if (toChange.reason.length > 900) return `The reason must not exceed 900 characters. Currently, it is ${toChange.reason.length}.`;

        for (let i = 0; i < toChange.targets.length; i++) {
            await modlogChannel.messages.fetch(toChange.targets[i])
                .then(async msg => {
                    var embed = msg.embeds[0]
                    if (!embed) {
                        outputMessage += `Failed to update reason for \`${toChange.targets[i]}\`: That doesn't look like a valid modlog entry.\n`;
                    } else {
                        embed.fields[2].value = `${toChange.reason} - Set by ${member.user.tag} (${member.user})`;
                        await msg.edit(embed)
                            .then(() => {
                                outputMessage += `Successfully updated reason for \`${toChange.targets[i]}\`\n`
                            })
                            .catch(err => {
                                outputMessage += `Failed to update reason for \`${toChange.targets[i]}\`: Unable to edit the message.\n`;
                            })
                    }
                })
                .catch(err => {
                    outputMessage += `Failed to update reason for \`${toChange.targets[i]}\`: Unable to find that message.\n`;
                })
        }

        return outputMessage;



    }
}

exports.kick = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && !member.hasPermission('KICK_MEMBERS') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}kick <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('KICK_MEMBERS')) return `I require the \`Kick Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only kick 10 members at a time.`;
    else if (reason.length > 500) return `The kick reason must not exceed 500 characters. Currently, it is ${reason.length}. You can set a longer reason afterwards with \`${config.prefix}reason\``;
    for (let i = 0; i < targets.length; i++) {
        let targetMember = guild.member(targets[i]);
        if (targetMember) {
            if (targetMember.kickable) {
                let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR') || targetMember.hasPermission('KICK_MEMBERS') || targetMember.hasPermission('BAN_MEMBERS')) && !member.hasPermission('ADMINISTRATOR')) {
                    outputMessage += `Unable to kick \`${targetMember.user.tag}\`: Only administrators can kick people with the moderator role and/or moderator permissions.\n`
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
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && !member.hasPermission('BAN_MEMBERS') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}ban <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('BAN_MEMBERS')) return `I require the \`Ban Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only ban 10 users at a time.`;
    else if (reason.length > 500) return `The ban reason must not exceed 500 characters. Currently, it is ${reason.length}. You can set a longer reason afterwards with \`${config.prefix}reason\``;
    for (let i = 0; i < targets.length; i++) {
        await guild.fetchBans().then(async bans => {//check if user is already banned
            if (bans.has(targets[i])) {
                outputMessage += `Unable to ban \`${targets[i]}\`: That user is already banned.\n`;
            } else {
                let targetMember = guild.member(targets[i]);
                if (targetMember) {
                    if (targetMember.bannable) {
                        let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                        if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR') || targetMember.hasPermission('KICK_MEMBERS') || targetMember.hasPermission('BAN_MEMBERS')) && !member.hasPermission('ADMINISTRATOR')) {
                            outputMessage += `Unable to ban \`${targetMember.user.tag}\`: Only administrators can ban people with the moderator role and/or moderator permissions.\n`
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
                            outputMessage += `Unable to ban \`${targets[i]}\`: That user does not exist.\n`;
                        })

                }
            }
        })

    }
    outputMessage += `**Ban Reason:**\n\`${reason}\``;
    return outputMessage;
}

exports.unban = async (guild, targets, member, reason, bot) => {
    var outputMessage = '';
    if (!member.hasPermission('ADMINISTRATOR') && member != guild.me) return `Only administrators can unban members.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}unban <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('BAN_MEMBERS')) return `I require the \`Ban Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only unban 10 users at a time.`;
    else if (reason.length > 500) return `The unban reason must not exceed 500 characters. Currently, it is ${reason.length}. You can set a longer reason afterwards with \`${config.prefix}reason\``;
    for (let i = 0; i < targets.length; i++) {
        await guild.fetchBans().then(async bans => {
            if (bans.has(targets[i])) {
                await guild.members.unban(targets[i], `[${member.user.tag}] ${reason}`).then(unbanned => {
                    outputMessage += `Successfully unbanned \`${unbanned.tag}\`\n`;
                    exports.modLogEvent(bot, guild, `UNBAN`, unbanned, member.user, reason);
                })

            } else {
                outputMessage += `Unable to unban \`${targets[i]}\`: They don't seem to be banned.\n`
            }
        })
    }
    outputMessage += `**Unban Reason:**\n\`${reason}\``;
    return outputMessage;
}