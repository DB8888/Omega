const mongo = require('./mongo');
exports.writeData = async (collectionName, data, overWriteConditions) => {
    await mongo().then(async mongoose => {
        const schema = require(`./schemas/${collectionName}-schema.js`)
        try {
            await schema.deleteMany(overWriteConditions)
            await new schema(data).save()
        } finally {
            mongoose.connection.close();
        }
    })
}

exports.fetchData = async (collectionName, keys) => {
    await mongo().then(async mongoose => {
        var result;
        const schema = require(`./schemas/${collectionName}-schema.js`)
        try {
            result = await schema.find(keys);
        } finally {
            mongoose.connection.close();
        }
        return result;
    })
}

exports.deleteData = async (collectionName, conditions) => {
    await mongo().then(async mongoose => {
        const schema = require(`./schemas/${collectionName}-schema.js`)
        try {
            await schema.deleteMany(conditions)
            
        } finally {
            mongoose.connection.close();
        }
    })
}