module.exports = class Command {
    name = ""; // Command name
    category = "General"; // What category the command falls under
    aliases = []; // Command aliases
    description = "A useful command!"; // Command description
    additionalInformation = "None" // Additional information about args usage etc
    usage = ""; // How the command should be used
    requiredArguments = 0; // Required number of arguments
    userPermissions = []; // User needs one of these permissions to execute command
    botPermissions = []; // Bot needs all of these permissions to execute command
    ownerOnly = false; // Only the owner can execute this command

    constructor(client) {
        this.client = client;
    }

    process(message, args) {
        if (args.length < this.requiredArguments) return this.sendUsage(message)
        else this.execute(message, args)
    }

    sendUsage(message) {
        message.channel.send(`Command usage: \`${this.client.config.prefix}${this.name} ${this.usage}\``)
    }

    execute(message, args) { }
}