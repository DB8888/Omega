const mongoose = require('mongoose');

const muteRoleSchema = mongoose.Schema({
    guild: String,
    role: String
})

module.exports = mongoose.model('muteRoles', muteRoleSchema)