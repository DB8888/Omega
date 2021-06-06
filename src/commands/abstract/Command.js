module.exports = class Command {
    name = "";
    aliases = [];
    description = "A useful command!";
    usage = "";
    requiredArguments = 0;
    permission = null;

    execute(message, args) {}
}