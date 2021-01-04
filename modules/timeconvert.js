module.exports = async (input, options) => {
    let split = input.match(/[a-zA-Z]+|[0-9]+(?:\.[0-9]+|)/g);
    var times = [];
    for (let i in split) {
        if (parseInt(split[i])) {
            times.push(split[i] + split[parseInt(parseInt(i) + parseInt(1))])
        }
    }
    if (options.convertTo === 'ms') {
        var output = 0;
        for (let i in times) {
            const ms = require('ms');
            output += ms(times[i])
        }
        return output;
    } else if (options.convertTo === 'long') {
        var output = '';
        for (let i in times) {
            const ms = require('ms')
            output += `${ms(ms(times[i]), { long: true })} `
        }
        return output.slice(0, -1);
    }

}