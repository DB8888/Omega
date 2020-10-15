const config = require('../config.js')

//error handling
exports.reportError = async (error, action, bot) => {
    var channelMessage = 'An internal error occured.';
    await bot.channels.cache.get(config.supportServerReportsChannel).send(`**Error while executing \`${action}\`:**\n\n\`\`\`\n${error}\`\`\``).then(msg => {
        channelMessage = `An internal error occurred. Code: \`${msg.id}\``;
    })
    return channelMessage;
}

//fetch an error
exports.fetchError = async (code, bot) => {
    var fetchedError = 'Unable to fetch error'
    await bot.channels.cache.get(config.supportServerReportsChannel).messages.fetch(code)
        .then(msg => {
            fetchedError = msg.content;
        })
        .catch(err => {
            fetchedError = 'That error does not exist';
        })
    return fetchedError;
}