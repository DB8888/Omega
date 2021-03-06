*V3.3.0*
- Snipe command

*V3.2.0*
- Small aesthetic updates to the moderation and reminder systems

*V3.1.0*
- You can now clear all messages after a particular message ID (including that message) with the clear command

*Version 3.0.0*
- Modlog messages are now rich embeds
- Introduced a tempban command
- Introduced a mute (and tempmute) command

*Version 2.5.0*
- Added a reminder command

*Version 2.4.0*
- Data storage migrated to MongoDB 

*Version 2.3.3*
- Fixed reason not showing when unbanning a user with another bot

*Version 2.3.2*
- Slight improvements to help command

*Version 2.3.1*
- Fixed a bug with the way we query the mod role

*Version 2.3.0*
- The ping command now calculates the time it takes to reply to the command

*Version 2.2.0*
- All commits to the GitHub repo will be automatically pulled upon restart

*Version 2.1.2*
- Reduced maximum kick/ban/unban reason length to 500 characters

*Version 2.1.1*
- Updated permissions for the reason command

*Version 2.1.0*
- Kicks, bans and unbans not executed using the bot will show up in the modlog
- The modlog command requires the bot to have the VIEW_AUDIT_LOG permission

*Version 2.0.0*
- Introduced some basic moderation features:
- Kick
- Ban
- Unban
- Modrole - allows a role without moderator permissions to use moderator commands
- Modlog - logs all moderator actions to a specific text channel
- Reason - allows the setting of a reason for specific moderator actions after they are executed