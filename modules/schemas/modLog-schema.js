const mongoose = require('mongoose');

const modLogSchema = mongoose.Schema({
    guild: String,
    channel: String
})

module.exports = mongoose.model('modLog', modLogSchema)