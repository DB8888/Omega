
exports.writeData = async (collectionName, data, overWriteConditions) => {

    const schema = require(`./schemas/${collectionName}-schema.js`)

    await schema.deleteMany(overWriteConditions)
    await new schema(data).save()


}

exports.fetchData = async (collectionName, keys) => {
    var result;
    const schema = require(`./schemas/${collectionName}-schema.js`)
    result = await schema.find(keys);
    return result;

}

exports.deleteData = async (collectionName, conditions) => {

    const schema = require(`./schemas/${collectionName}-schema.js`)

    await schema.deleteMany(conditions)


}
