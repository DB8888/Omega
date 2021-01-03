const dataManager = require('./datamanagement')
const ms = require('ms')

module.exports = async (bot) => {
    cycleReminders(bot)
    setInterval(function () {
        cycleReminders(bot)
    }, 60000)
}

async function cycleReminders (bot) {
    const reminders = await dataManager.fetchData('reminders', {});
    for(let i in reminders){
        if(reminders[i].time < Date.now()){
            bot.users.cache.get(reminders[i].user).send(`You asked me to remind you:\n\`${reminders[i].reminder}\``);
            dataManager.deleteData('reminders', {
                _id: reminders[i]._id
            })
        }
    }
}