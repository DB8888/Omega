/*
This module handles the storage and retrieval of bot data in a series of discord messages (yes i know this is extremely unorthodox)
*/

const Discord = require('discord.js');
const config = require('../config.js');


//fetch all messages in a channel (currently capped at 12000)
//always use the await keyword when using this function
exports.fetchAllChannelMessages = async (channel, limit) => {
    if (!limit) { limit = 12000; }//to prevent api spam and such, defaults to 12000
    var sum_messages = [];
    let last_id;
    while (true) {
        var options = { limit: 100 }
        if (last_id) {
            options.before = last_id;
        }
        var messages = await channel.messages.fetch(options);
        sum_messages.push(...messages.array());
        last_id = messages.last().id;

        if (messages.size != options.limit || sum_messages.length >= limit) {
            break;
        }
    }

    return sum_messages;//returns an array;
}

//fetch a value from a channel with a key. Messages are in the format "key\nvalue"
exports.getValue = async (key, location, bot) => {
    var fetchedData = await exports.fetchAllChannelMessages(bot.channels.cache.get(location));
    var value = 'Key not found'
    for (i = 0; i < fetchedData.length; i++) {
        let entry = fetchedData[i].content.split('\n');
        if (entry[0] === key) {
            value = entry[1];
            break;
        }

    }
    return value;
}

//delete a data entry
exports.deleteEntry = async (key, location, bot) => {
    var fetchedData = await exports.fetchAllChannelMessages(bot.channels.cache.get(location));
    for (i = 0; i < fetchedData.length; i++) {
        let entry = fetchedData[i].content.split('\n');
        if (entry[0] === key) {
            fetchedData[i].delete();
        }

    }
}

exports.newEntry = async(key, value, location, bot) => {
    await exports.deleteEntry(key, location, bot)
    bot.channels.cache.get(location).send(`${key}\n${value}`);
}