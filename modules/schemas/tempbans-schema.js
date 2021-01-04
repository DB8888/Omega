const mongoose = require('mongoose');

const tempbanSchema = mongoose.Schema({
    guild: String,
    user: String,
    expires: Number,
    unbanAttempts: Number
})

module.exports = mongoose.model('tempbans', tempbanSchema)