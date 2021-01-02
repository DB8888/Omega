require('dotenv').config()

const mongoose = require('mongoose');
const mongoPath = `mongodb://Bot:${process.env.MONGODB_PASSWORD}@omega-shard-00-00.o2k6t.mongodb.net:27017,omega-shard-00-01.o2k6t.mongodb.net:27017,omega-shard-00-02.o2k6t.mongodb.net:27017/data?ssl=true&replicaSet=atlas-smozyd-shard-0&authSource=admin&retryWrites=true&w=majority`;

const config = require('../config')


module.exports = async () => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        poolSize: 20
    })
    return mongoose;
}