const mongoose = require('mongoose');

const modRoleSchema = mongoose.Schema({
    guild: String,
    role: String
})

module.exports = mongoose.model('modRoles', modRoleSchema)