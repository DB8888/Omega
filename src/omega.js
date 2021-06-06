// Import shit (smh why doesn't nodejs have import statements)
const Discord = require("discord.js");
require("dotenv").config();
const fs = require("fs");
const Module = require("./modules/abstract/Module.js");

// Setup Discord bot
console.log("Setting up Discord stuff");
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Start up modules
    console.log("Enabling modules");
    const moduleFiles = fs.readdirSync("src/modules");
    moduleFiles.forEach(f => {
        if (f == "abstract") return; // Ignore the abstract directory
        const module = new (require(`./modules/${f}`));
        if (!module instanceof Module) throw new Error(`Module ${f} does not extend "Module"`);
        module.initialise(client);
        module.onEnable();
    });
});

// Import configuration
client.config = JSON.parse(fs.readFileSync("config/config.json"));