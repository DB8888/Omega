/*
This module handles the storage and retrieval of bot data in a series of discord messages (yes i know this is extremely unorthodox)
*/

const Discord = require('discord.js');
const config = require('../config.js');


//fetch all messages in a channel (currently capped at 10000)
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