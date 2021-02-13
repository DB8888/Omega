const dataManager = require('./datamanagement')
const moderation = require('./moderation')

module.exports = async (bot) => {
    await cycleReminders(bot)
    await cycleTempbans(bot)
    await cycleMutes(bot)
    setInterval(async function () {
        await cycleReminders(bot)
        await cycleTempbans(bot)
        await cycleMutes(bot)
    }, 60000)
}

async function cycleReminders (bot) {
    const reminders = await dataManager.fetchData('reminders', {});
    for(let i in reminders){
        if(reminders[i].time < Date.now()){
            bot.users.cache.get(reminders[i].user).send(`You asked me to remind you:\n${reminders[i].reminder}`).catch(err => {})
            dataManager.deleteData('reminders', {
                _id: reminders[i]._id
            })
        }
    }
}

async function cycleTempbans (bot) {
    const tempbans = await dataManager.fetchData('tempbans', {});
    for (let i in tempbans) {
        if(tempbans[i].expires < Date.now()) {
            let guild = bot.guilds.cache.get(tempbans[i].guild);
            if(!guild) {
                failed()
            }
            guild.members.unban(tempbans[i].user, "Automatic Unban")
                .then(async user => {
                    moderation.modLogEvent(bot, guild, 'UNBAN', user, bot.user, "Time's up!")
                    await dataManager.deleteData('tempbans', {_id: tempbans[i]._id})
                })
                .catch(err => {
                    console.log(err)
                    failed()
                })
        }
        async function failed () {
            newData = tempbans[i];
                newData.unbanAttempts++;
                if(newData.unbanAttempts > 2000) {
                    await dataManager.deleteData('tempbans', {_id: tempbans[i]._id})
                } else {
                    await dataManager.writeData('tempbans', newData, tempbans[i])
                }
        }
    }
}

async function cycleMutes (bot) {
    const mutes = await dataManager.fetchData('mutes', {});
    for (let i in mutes) {
        if(mutes[i].expires < Date.now()) {
            let guild = bot.guilds.cache.get(mutes[i].guild);
            if(!guild) {
                failed()
            }
            bot.users.fetch(mutes[i].user).then(async user => {
                var guild = bot.guilds.cache.get(mutes[i].guild)
                var member = guild.member(mutes[i].user);
                if(member){
                    var muteRole = await dataManager.fetchData('muteRoles', { guild: guild.id });
                    muteRole = muteRole[0].role
                    await member.roles.remove(muteRole, `Automatic unmute`).catch(err => {
                        failed()
                    })
                }
                await user.send(`You are now unmuted in ${guild.name}.`).catch(err => {})
                moderation.modLogEvent(bot, guild, "UNMUTE", user, bot.user, "Time's up!")
                await dataManager.deleteData('mutes', {_id: mutes[i]._id})
            })
        }
        async function failed () {
            newData = mutes[i];
                newData.unmuteAttempts++;
                if(newData.unmuteAttempts > 2000) {
                    await dataManager.deleteData('mutes', {_id: mutes[i]._id})
                } else {
                    await dataManager.writeData('mutes', newData, mutes[i])
                }
        }
    }
}