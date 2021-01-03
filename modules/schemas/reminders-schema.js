const mongoose = require('mongoose');

const reminderSchema = mongoose.Schema({
    user: String,
    reminder: String,
    time: Number
})

module.exports = mongoose.model('reminders', reminderSchema)