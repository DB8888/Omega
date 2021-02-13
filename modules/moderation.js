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
    else return `Command usage: ${config.prefix}modrole <role mention/id>`
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

exports.modLogEvent = async (bot, guild, type, user, moderator, reason, duration) => {
    var rawData = await datamanager.fetchData('modLog', { guild: guild.id });
    var modlogChannelID = rawData[0] ? rawData[0].channel : false;
    var modlogChannel = modlogChannelID ? bot.channels.cache.get(modlogChannelID) : false;
    if (!modlogChannel) return 0;
    else {
        const log = new Discord.MessageEmbed()
            .setTitle(duration === undefined ? type : `${type} | ${duration.words}`)
            .setTimestamp()
            .addFields(
                { name: 'User', value: `${user.tag} (${user})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag} (${moderator.tag === 'Unknown' ? '?' : moderator})`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setColor(config.modLogEmbedColours[type])
        if (duration) {
            let date = new Date(duration.expires)
            log.setFooter(`Expires at: ${date.toUTCString()}`)
        }
        modlogChannel.send(log).then(msg => {
            if (reason === 'Unspecified') {
                const edit = new Discord.MessageEmbed()
                    .setTitle(duration === undefined ? type : `${type} | ${duration.words}`)
                    .setTimestamp()
                    .addFields(
                        { name: 'User', value: `${user.tag} (${user})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.tag === 'Unknown' ? '?' : moderator})`, inline: true },
                        { name: 'Reason', value: reason === 'Unspecified' ? `Responsible moderator, do \`${config.prefix}reason ${msg.id}\` to set` : reason }
                    )
                    .setColor(config.modLogEmbedColours[type])
                if (duration) {
                    let date = new Date(duration.expires)
                    edit.setFooter(`Expires at: ${date.toUTCString()}`)
                }
                msg.edit(edit)
            }
        }).catch(err => { })//in case channel is deleted or unable to send for some reason
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
        if (toChange.reason.length > 210) return `The set reason must not exceed 210 characters. Currently, it is ${toChange.reason.length}.`;

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
    else if (reason.length > 250) return `The kick reason must not exceed 250 characters. Currently, it is ${reason.length}. `;
    for (let i = 0; i < targets.length; i++) {
        let targetMember = guild.member(targets[i]);
        if (targetMember) {
            if (targetMember.kickable) {
                let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR') || targetMember.hasPermission('KICK_MEMBERS') || targetMember.hasPermission('BAN_MEMBERS')) && !member.hasPermission('ADMINISTRATOR')) {
                    outputMessage += `Unable to kick \`${targetMember.user.tag}\`: Only administrators can kick people with the moderator role and/or moderator permissions.\n`
                } else {
                    await targetMember.user.send(`You were kicked from ${targetMember.guild.name} by ${member.user.tag}.\n**Reason:** ${reason}`).catch(err => { });
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
    outputMessage += `**Kick Reason:**\n${reason}`;
    return outputMessage;
}

exports.ban = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && !member.hasPermission('BAN_MEMBERS') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}ban <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('BAN_MEMBERS')) return `I require the \`Ban Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only ban 10 users at a time.`;
    else if (reason.length > 250) return `The ban reason must not exceed 250 characters. Currently, it is ${reason.length}. `;
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
                            await targetMember.user.send(`You were banned from ${targetMember.guild.name} by ${member.user.tag}.\n**Reason:** ${reason}`).catch(err => { });
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
    outputMessage += `**Ban Reason:**\n${reason}`;
    return outputMessage;
}

exports.unban = async (guild, targets, member, reason, bot) => {
    var outputMessage = '';
    if (!member.hasPermission('ADMINISTRATOR') && member != guild.me) return `Only administrators can unban members.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}unban <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('BAN_MEMBERS')) return `I require the \`Ban Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only unban 10 users at a time.`;
    else if (reason.length > 250) return `The unban reason must not exceed 250 characters. Currently, it is ${reason.length}. `;
    for (let i = 0; i < targets.length; i++) {
        await guild.fetchBans().then(async bans => {
            if (bans.has(targets[i])) {
                await guild.members.unban(targets[i], `[${member.user.tag}] ${reason}`).then(unbanned => {
                    outputMessage += `Successfully unbanned \`${unbanned.tag}\`\n`;
                    exports.modLogEvent(bot, guild, `UNBAN`, unbanned, member.user, reason);
                    exports.deregisterTempBan(guild, unbanned);
                })

            } else {
                outputMessage += `Unable to unban \`${targets[i]}\`: They don't seem to be banned.\n`
            }
        })
    }
    outputMessage += `**Unban Reason:**\n${reason}`;
    return outputMessage;
}

//tempban
exports.tempban = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && !member.hasPermission('BAN_MEMBERS') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}tempban <@mentions/IDs> <time> [reason]`;
    else if (!guild.me.hasPermission('BAN_MEMBERS')) return `I require the \`Ban Members\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only tempban 10 users at a time.`;
    else if (reason.length > 250) return `The tempban reason must not exceed 250 characters. Currently, it is ${reason.length}. `;

    //get tempban time
    const timeConvert = require('./timeconvert');
    let splitReason = reason.split(' ');
    if (!splitReason[1]) {
        reason += ' Unspecified';
    }
    let timeMs = await timeConvert(splitReason[0], { convertTo: 'ms' });
    const time = await timeConvert(splitReason[0], { convertTo: 'long' })
    if (!parseInt(timeMs)) return `That's not a valid time.`;

    for (let i = 0; i < targets.length; i++) {
        await guild.fetchBans().then(async bans => {//check if user is already banned
            if (bans.has(targets[i])) {
                outputMessage += `Unable to tempban \`${targets[i]}\`: That user is already banned.\n`;
            } else {
                let targetMember = guild.member(targets[i]);
                if (targetMember) {
                    if (targetMember.bannable) {
                        let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                        if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR') || targetMember.hasPermission('KICK_MEMBERS') || targetMember.hasPermission('BAN_MEMBERS')) && !member.hasPermission('ADMINISTRATOR')) {
                            outputMessage += `Unable to tempban \`${targetMember.user.tag}\`: Only administrators can ban people with the moderator role and/or moderator permissions.\n`
                        } else {
                            await targetMember.user.send(`You were temporarily banned from ${targetMember.guild.name} for ${time} by ${member.user.tag}.\nReason: ${reason.split(' ').slice(1).join(' ')}`).catch(err => { });
                            await targetMember.ban({ reason: `[${member.user.tag}] [${time}] ${reason.split(' ').slice(1).join(' ')}` });
                            exports.modLogEvent(bot, guild, `TEMP BAN`, targetMember.user, member.user, reason.split(' ').slice(1).join(' '), { words: time, expires: Date.now() + timeMs });
                            registerTempban(targetMember.user, guild, timeMs)
                            outputMessage += `Successfully tempbanned \`${targetMember.user.tag}\`\n`;
                        }
                    } else {
                        outputMessage += `Unable to tempban \`${targetMember.user.tag}\`: I don't have permission to ban them.\n`;
                    }
                } else {

                    await guild.members.ban(targets[i], { reason: `[${member.user.tag}] [${time}] ${reason.split(' ').slice(1).join(' ')}` })
                        .then(banned => {
                            exports.modLogEvent(bot, guild, `TEMP BAN`, banned, member.user, reason.split(' ').slice(1).join(' '), { words: time, expires: Date.now() + timeMs });
                            outputMessage += `Successfully tempbanned \`${banned.tag}\`\n`;
                            registerTempban(banned, guild, timeMs)
                        })
                        .catch(err => {
                            console.log(err)
                            outputMessage += `Unable to tempban \`${targets[i]}\`: That user does not exist.\n`;
                        })

                }
            }
        })

    }
    outputMessage += `**Tempban Reason:**\n${reason.split(' ').slice(1).join(' ')}\n**Duration:** ${time}`;
    return outputMessage;
}

async function registerTempban(user, guild, timeMs) {
    let data = { guild: guild.id, user: user.id, expires: Date.now() + timeMs, unbanAttempts: 0 };
    await datamanager.writeData('tempbans', data)
}

exports.deregisterTempBan = async (guild, user) => {//exported because it's called by the unban detector in index.js. its purpose is to remove the record for a tempban if the user has been unbanned manually
    await datamanager.deleteData('tempbans', { guild: guild.id, user: user.id });
}

exports.setMuteRole = async (guild, roleMentions, member, args, bot) => {
    if (!args[1]) {
        var currentMuteRoleData = await datamanager.fetchData('muteRoles', { guild: guild.id });
        var currentMuteRole;
        if (!currentMuteRoleData[0]) {
            currentMuteRole = { name: undefined }
        } else {
            currentMuteRole = await guild.roles.cache.get(currentMuteRoleData[0].role)
        }
        return `This server's mute role is \`${currentMuteRole.name}\``;
    }
    else if (!member.hasPermission('ADMINISTRATOR')) return 'You must have the `Administrator` permission to set the mute role.';
    else if (roleMentions.size === 1) {
        await datamanager.writeData('muteRoles', { guild: guild.id, role: roleMentions.first().id }, { guild: guild.id })
        return `Mute role set to \`${roleMentions.first().name}\``;
    }
    else if (guild.roles.cache.has(args[1])) {
        await datamanager.writeData('muteRoles', { guild: guild.id, role: args[1] }, { guild: guild.id })
        return `Mute role set to \`${guild.roles.cache.get(args[1]).name}\``;
    }
    else if (args[1] === 'off') {
        await datamanager.deleteData('muteRoles', { guild: guild.id })
        return `This server no longer has a mute role`
    }
    else return `Command usage: ${config.prefix}muterole <role mention/id>`
}

exports.mute = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    var muteRole = await datamanager.fetchData('muteRoles', { guild: guild.id });
    if (!muteRole[0]) return `This server doesn't have a mute role. Please set one first.`
    muteRole = muteRole[0].role;
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && !member.hasPermission('BAN_MEMBERS') && !member.hasPermission('KICK_MEMBERS') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}mute <@mentions/IDs> [time] [reason]`;
    else if (!guild.me.hasPermission('MANAGE_ROLES')) return `I require the \`Manage Roles\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only mute 10 users at a time.`;
    else if (reason.length > 250) return `The mute reason must not exceed 250 characters. Currently, it is ${reason.length}. `;

    //get tempmute time
    const timeConvert = require('./timeconvert');
    let splitReason = reason.split(' ');

    let timeMs = await timeConvert(splitReason[0], { convertTo: 'ms' });
    const time = await timeConvert(splitReason[0], { convertTo: 'long' })
    var timedMute = true;
    if (!parseInt(timeMs)) {//if no time is specified
        timedMute = false;
    } else {
        reason = splitReason.slice(1).join(' ');
        if (!splitReason[1]) {
            reason += 'Unspecified';
        }
    }
    for (let i in targets) {
        let userMutes = await datamanager.fetchData('mutes', { guild: guild.id, user: targets[i] })
        if (!userMutes[0]) {
            let targetMember = guild.member(targets[i]);
            if (targetMember) {
                let targetMemberModRole = await exports.queryModRole(guild, targetMember, bot);
                if ((targetMemberModRole || targetMember.hasPermission('ADMINISTRATOR') || targetMember.hasPermission('KICK_MEMBERS') || targetMember.hasPermission('BAN_MEMBERS'))) {
                    outputMessage += `Unable to mute \`${targetMember.user.tag}\`: Moderators cannot be muted.\n`
                } else {
                    await targetMember.roles.remove(muteRole).catch(err => { })
                    await targetMember.roles.add(muteRole, `[${member.user.tag}] ${timedMute ? `[${time}]` : ''} ${reason}`)
                        .then(async () => {
                            if (timedMute) {
                                await datamanager.writeData('mutes', { guild: guild.id, user: targets[i], expires: Date.now() + timeMs, unmuteAttempts: 0 });
                                await exports.modLogEvent(bot, guild, "MUTE", targetMember.user, member.user, reason, { words: time, expires: Date.now() + timeMs });
                                outputMessage += `Successfully muted \`${targetMember.user.tag}\`\n`
                                targetMember.user.send(`You were muted in ${guild.name} for ${time} by ${member.user.tag}\n**Reason:** ${reason}`).catch(err => { })
                            } else {
                                await datamanager.writeData('mutes', { guild: guild.id, user: targets[i], expires: 999999999999999, unmuteAttempts: 0 });
                                await exports.modLogEvent(bot, guild, "MUTE", targetMember.user, member.user, reason);
                                outputMessage += `Successfully muted \`${targetMember.user.tag}\`\n`
                                targetMember.user.send(`You were muted in ${guild.name} by ${member.user.tag}\n**Reason:** ${reason}`).catch(err => { })
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            outputMessage += `Unable to mute \`${targets[i]}\`: I was unable to add the mute role to them\n`;
                        })
                }
            } else {
                outputMessage += `Unable to mute \`${targets[i]}\`: They're not a member of this server\n`;
            }
        } else {
            outputMessage += `Unable to mute \`${targets[i]}\`: They are already muted\n`;
        }

    }
    outputMessage += `**Mute Reason:**\n${reason}${timedMute ? `\n**Duration:** ${time}` : ''}`;
    return outputMessage;
}



exports.unmute = async (guild, targets, member, reason, bot) => {
    var modRoleQuery = await exports.queryModRole(guild, member, bot);
    var outputMessage = '';
    var muteRole = await datamanager.fetchData('muteRoles', { guild: guild.id });
    if (!muteRole[0]) return `This server doesn't have a mute role. Please set one first.`
    muteRole = muteRole[0].role;
    if (modRoleQuery === false && !member.hasPermission('ADMINISTRATOR') && !member.hasPermission('BAN_MEMBERS') && !member.hasPermission('KICK_MEMBERS') && member != guild.me) return `You do not have permission to execute this command.`;
    else if (targets.length === 0) return `Command usage: ${config.prefix}unmute <@mentions/IDs> [reason]`;
    else if (!guild.me.hasPermission('MANAGE_ROLES')) return `I require the \`Manage Roles\` permission to execute this command.`;
    else if (targets.length > 10) return `You may only unmute 10 users at a time.`;
    else if (reason.length > 250) return `The unmute reason must not exceed 250 characters. Currently, it is ${reason.length}. `;

    for (let i in targets) {
        await bot.users.fetch(targets[i]).then(async user => {
            let userMutes = await datamanager.fetchData('mutes', { guild: guild.id, user: targets[i] })
            if (userMutes[0]) {
                var targetMember = guild.member(targets[i]);
                if (targetMember) {
                    await targetMember.roles.remove(muteRole, `[${member.user.tag}] ${reason}`).catch(err => { })
                }
                await user.send(`You were unmuted in ${guild.name} by ${member.user.tag}\n**Reason:** ${reason}`).catch(err => { })
                exports.modLogEvent(bot, guild, "UNMUTE", user, member.user, reason)
                await datamanager.deleteData('mutes', { guild: guild.id, user: targets[i] })
                outputMessage += `Successfully unmuted \`${user.tag}\`\n`;
            } else {
                outputMessage += `Failed to unmute \`${user.tag}\`: They aren't muted\n`
            }
        }).catch(err => {
            console.log(err)
            outputMessage += `Failed to unmute \`${targets[i]}\`: That user does not exist\n`
        })
    }
    outputMessage += `**Unmute reason:**\n${reason}`
    return outputMessage;
}
