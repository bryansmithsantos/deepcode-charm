const BaseCharm = require('./BaseCharm');
/**
 * Kick Charm
 * Kicks a user from the server.
 *
 * Tier 1: $kick[@user]
 * Tier 2: $kick[user: @user; reason: Spam]
 * Tier 3: $kick[{"user": "@user", "reason": "Rule violation"}]
 *
 * Arguments:
 * - user (string, required): The user to kick (mention or ID)
 * - reason (string, optional): Reason for the kick
 */
class KickCharm extends BaseCharm {
  async execute(args, context) {
    try {
      const options = this.parse(args);
      if (!options.user) {
        return this.reply(context, { content: '❌ Please specify a user to kick.' });
      }
      const member = await this.findMember(context.message.guild, options.user);
      if (!member) {
        return this.reply(context, { content: '❌ User not found.' });
      }
      await member.kick(options.reason || 'No reason provided');
      await this.reply(context, { content: `✅ Kicked ${member.user.tag}.` });
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
module.exports = KickCharm; 