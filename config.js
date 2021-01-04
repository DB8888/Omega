require('dotenv').config()

//prefix
if (process.env.TEST === '1') {
    exports.prefix = 'omegatest!'
} else {
    exports.prefix = 'o!';
}

//owner
exports.owner = '716779626759716914';

//embed colour
exports.embedColour = '#e67e22';

//Support server ID
exports.supportServer = '766052246953000974';

//Support server information voice channels
exports.supportServerMemberCountChannel = '766053924381655060';
exports.supportServerUserCountChannel = '766058816772505600';
exports.supportServerGuildCountChannel = '766059397570232340';

//Support server announcement channel
exports.supportServerAnnouncementChannel = '770224091423834132';

//Support server invite link
exports.supportServerInviteLink = 'https://discord.gg/AKPkZwR';

//Support server error reports channel
exports.supportServerReportsChannel = '766370859718934528';

//Bot invite link
exports.botInviteLink = 'https://discord.com/oauth2/authorize?client_id=760869247005229096&scope=bot&permissions=268790990';

//logging
exports.startupLoggingChannel = '777206414787477545';
exports.commandLoggingChannel = '777567526217318430';
exports.DMLoggingChannel = '787648931176775710';

exports.modLogEmbedColours = {
    "BAN": '#FF0000',
    "KICK": '#FFFF00',
    "UNBAN": '#00FF00',
    "TEMP BAN": '#FF0000',
    "MUTE": '#FFFF00',
    "UNMUTE": '#00FF00'
}