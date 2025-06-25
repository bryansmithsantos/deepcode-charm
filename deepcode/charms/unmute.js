const BaseCharm = require('./BaseCharm');
/**
 * Unmute Charm
 * Unmutes a user in the server.
 *
 * Tier 1: $unmute[@user]
 * Tier 2: $unmute[user: @user]
 * Tier 3: $unmute[{"user": "@user"}]
 *
 * Arguments:
 * - user (string, required): The user to unmute (mention or ID)
 */
class UnmuteCharm extends BaseCharm {
  async execute(args, context) {
    try {
      const options = this.parse(args);
      if (!options.user) {
        return this.reply(context, { content: '❌ Please specify a user to unmute.' });
      }
      const member = await this.findMember(context.message.guild, options.user);
      if (!member) {
        return this.reply(context, { content: '❌ User not found.' });
      }
      const muteRole = context.message.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      if (!muteRole) {
        return this.reply(context, { content: '❌ No "Muted" role found.' });
      }
      await member.roles.remove(muteRole, 'Unmuted');
      await this.reply(context, { content: `✅ Unmuted ${member.user.tag}.` });
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
module.exports = UnmuteCharm; 