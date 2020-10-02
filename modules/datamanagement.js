/*
This module handles the storage and retrieval of bot data in a series of discord messages.
*/

const Discord = require('discord.js');
const config = require('../config.js');

exports.newGuild = (bot, guild) => {
    var cancel;
    //check if guild data already exists
    bot.channels.cache.get(config.indexChannel).messages.fetch({ limit: 100 }).then(messages => {
        messages.forEach(m => {
            let data = JSON.parse(m.content);
            console.log(data);
            if (data[guild.id]){
                cancel = true; //cancel data add
            }
        })
    })
    if(cancel) return 0; //check if a cancel has been called
    //if guild is new
    bot.channels.cache.get(config.storageChannel).send('{}').then(msg => {
        bot.channels.cache.get(config.indexChannel).messages.fetch().then(indexes => {
            if (indexes.last().content.length < 1750) {//if index message is not close to character limit
                let newGuildEntry = JSON.parse(indexes.last().content);
                newGuildEntry[guild.id] = {
                    messageID: msg.id
                }
                indexes.last().edit(JSON.stringify(newGuildEntry));
            } else {//if index message is close to character limit, make a new one
                bot.channels.cache.get(config.indexChannel).send('{}').then(newIndexMessage => {
                    let newGuildEntry = JSON.parse(newIndexMessage.content);
                    newGuildEntry[guild.id] = {
                        messageID: msg.id
                    }
                    newIndexMessage.edit(JSON.stringify(newGuildEntry));
                })
            }
        })
    })

}