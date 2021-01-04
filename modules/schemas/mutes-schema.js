const mongoose = require('mongoose');

const muteSchema = mongoose.Schema({
    guild: String,
    user: String,
    expires: Number,
    unmuteAttempts: Number
})

module.exports = mongoose.model('mutes', muteSchema)