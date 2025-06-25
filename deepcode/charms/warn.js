const BaseCharm = require('./BaseCharm');
/**
 * Warn Charm
 * Warns a user in the server.
 *
 * Tier 1: $warn[@user]
 * Tier 2: $warn[user: @user; reason: Spam]
 * Tier 3: $warn[{"user": "@user", "reason": "Spam"}]
 *
 * Arguments:
 * - user (string, required): The user to warn (mention or ID)
 * - reason (string, optional): Reason for the warning
 */
class WarnCharm extends BaseCharm {
  async execute(args, context) {
    try {
      const options = this.parse(args);
      if (!options.user) {
        return this.reply(context, { content: '❌ Please specify a user to warn.' });
      }
      const member = await this.findMember(context.message.guild, options.user);
      if (!member) {
        return this.reply(context, { content: '❌ User not found.' });
      }
      // You can implement a warning system (e.g., log to DB or send DM)
      await this.reply(context, { content: `⚠️ Warned ${member.user.tag}${options.reason ? `: ${options.reason}` : ''}` });
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
module.exports = WarnCharm; 