require('dotenv').config()

const mongoose = require('mongoose');
const mongoPath = `mongodb+srv://Bot:${process.env.MONGODB_PASSWORD}@omega.o2k6t.mongodb.net/data?retryWrites=true&w=majority`;

const config = require('../config')


module.exports = async () => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        poolSize: 20
    })
    return mongoose;
}