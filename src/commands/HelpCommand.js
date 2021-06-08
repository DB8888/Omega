const { MessageEmbed } = require("discord.js");
const config = require("../../config/config.js");
const Command = require("../commands/abstract/Command.js");
const CommandUtil = require("../util/CommandUtil.js");
const StringUtil = require("../util/StringUtil.js");

module.exports = class HelpCommand extends Command {
    name = "help";
    aliases = ["h"];
    description = "Returns a list of commands and their uses / returns information on a command.";
    usage = "[command]";

    execute(message, args) {
        if (args.length < 1) { // Not looking for help on a specific command
            const helpEmbed = new MessageEmbed()
                .setTitle("Omega Help Menu")
                .setColor(config.embedColor)
                .setDescription(`Prefix: \`${config.prefix}\`\nFor help on a specific command, do \`${config.prefix}help <command>\`\nGot an issue? Join our [Support Server](${config.supportServerInviteLink})`);

            // Go through each of the bot's commands and display fields for each category
            const commandsSorted = {};
            message.client.commands.forEach(c => {
                if (!commandsSorted[c.category]) commandsSorted[c.category] = [];
                commandsSorted[c.category].push(c);
            })

            for (let category in commandsSorted) {
                if (category == "Owner") continue; // Ignore owner commands
                let fieldValue = "";
                commandsSorted[category].forEach(c => {
                    fieldValue += (`\`${c.name} ${c.usage}`).trim() + `\` - ${c.description}\n`;
                }) 
                helpEmbed.addField(category, fieldValue);
            }

            message.channel.send(helpEmbed);
        } else { // User wants help on a specific command
            const command = CommandUtil.findCommand(args[0], this.client);
            if (!command) {
                message.channel.send(`${this.client.config.xmark} Couldn't find that command.`)
            } else {
                const helpEmbed = new MessageEmbed()
                    .setTitle(StringUtil.capitaliseFirstLetter(command.name) + " Command")
                    .setColor(this.client.config.embedColor)
                    .setDescription(command.description)
                    .addField("Aliases", command.aliases.length > 0 ? command.aliases : "None", true)
                    .addField("Category", command.category, true)
                    .addField("Required Bot Permissions", command.botPermissions > 0 ? command.botPermissions : "None", true)
                    .addField("User Permissions (one required)", command.userPermissions > 0 ? command.userPermissions : "None", true)
                    .addField("Usage", this.client.config.prefix + command.name + " " + command.usage)
                    .addField("Additional Information", command.additionalInformation);
                message.channel.send(helpEmbed);
            }
        }
    }
}