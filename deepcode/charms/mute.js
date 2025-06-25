const BaseCharm = require('./BaseCharm');
/**
 * Mute Charm
 * Mutes a user in the server.
 *
 * Tier 1: $mute[@user]
 * Tier 2: $mute[user: @user; duration: 10m]
 * Tier 3: $mute[{"user": "@user", "duration": "10m", "reason": "Spam"}]
 *
 * Arguments:
 * - user (string, required): The user to mute (mention or ID)
 * - duration (string, optional): Duration of mute (e.g., 10m, 1h)
 * - reason (string, optional): Reason for the mute
 */
class MuteCharm extends BaseCharm {
  async execute(args, context) {
    try {
      const options = this.parse(args);
      if (!options.user) {
        return this.reply(context, { content: '❌ Please specify a user to mute.' });
      }
      const member = await this.findMember(context.message.guild, options.user);
      if (!member) {
        return this.reply(context, { content: '❌ User not found.' });
      }
      // This example assumes you have a Muted role set up
      const muteRole = context.message.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      if (!muteRole) {
        return this.reply(context, { content: '❌ No "Muted" role found.' });
      }
      await member.roles.add(muteRole, options.reason || 'Muted');
      await this.reply(context, { content: `✅ Muted ${member.user.tag}.` });
      // Optionally, implement duration logic here
    } catch (error) {
      await this.reply(context, { content: '❌ Error: ' + error.message });
      throw error;
    }
  }
  async findMember(guild, userString) {
    const userId = userString.replace(/[<@!>]/g, '');
    try { return await guild.members.fetch(userId); } catch { return null; }
  }
}
module.exports = MuteCharm; 