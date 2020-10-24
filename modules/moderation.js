const Discord = require('discord.js');
const config = require('../config.js');
const datamanager = require('./datamanagement.js');

exports.setModRole = async (guild, roleMentions, member, args, bot) => {
    var currentModRole = await guild.roles.cache.get(await datamanager.getValue(guild.id, config.modRoleStorageChannel, bot));
    if(!currentModRole) {currentModRole = `nope`};
    if (!args[1]) return `This server's moderator role is \`${currentModRole.name}\``;
    else if (!member.hasPermission('ADMINISTRATOR')) return 'You must have the `Administrator` permission to set the moderator role.';
    else if (roleMentions.size === 1) {
        await datamanager.deleteEntry(guild.id, config.modRoleStorageChannel, bot);
        await datamanager.newEntry(guild.id, roleMentions.first().id, config.modRoleStorageChannel, bot);
        return `Mod role set to \`${roleMentions.first().name}\``;
    }
    else if (guild.roles.cache.has(args[1])) {
        await datamanager.deleteEntry(guild.id, config.modRoleStorageChannel, bot);
        await datamanager.newEntry(guild.id, args[1], config.modRoleStorageChannel, bot);
        return `Mod role set to \`${guild.roles.cache.get(args[1]).name}\``;
    }
    else return `Command usage: ${config.prefix}modrole [role mention/id]`
}