const Module = require("./abstract/Module.js");
const fs = require("fs");
const CommandUtil = require("../util/CommandUtil.js");

module.exports = class CommandHandler extends Module {
    name = "Command Handler";

    onEnable() {
        // Register commands
        this.logger.info("Registering commands");
        this.client.commands = [];
        const commandFiles = fs.readdirSync("src/commands")
        commandFiles.forEach(f => {
            if (f == "abstract") return; // Ignore the abstract directory
            const command = require(`../commands/${f}`);
            this.client.commands.push(Reflect.construct(command, [this.client]));
        })
    }

    onMessage(message) {
        if (message.author.bot) return;
        if (message.content.toLowerCase().startsWith(this.client.config.prefix)) {
            const args = message.content.toLowerCase().substring(this.client.config.prefix.length).trim().split(" ");
            const command = CommandUtil.findCommand(args[0], this.client);
            if (command) {
                command.process(message, args.splice(1, 1));
                this.logger.info(`Dispatching command ${command.name}`);
            }
        }
    }
}