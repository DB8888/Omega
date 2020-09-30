//changelog command
exports.changelog = () => {
    const fs = require('fs');
    const changelog = fs.readFileSync('./changelog.txt');
    return `\`\`\`\n${changelog}\n\`\`\``;
}