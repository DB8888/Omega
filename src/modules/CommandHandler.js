const Module = require("./abstract/Module.js");
const fs = require("fs");

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
            this.client.commands.push(new (command));
        })
    }

    onMessage(message) {
        if (message.author.bot) return;
        if (message.content.startsWith(this.client.config.prefix)) {
            var args = message.content.substring(this.client.config.prefix.length).trim().split(" ");
            this.client.commands.forEach(c => {
                if (c.name == args[0] || c.aliases.includes(args[0])) c.execute(message, args.splice(0, 1));
                this.logger.info(`Dispatching command ${c.name}`)
            })
        }
    }
}