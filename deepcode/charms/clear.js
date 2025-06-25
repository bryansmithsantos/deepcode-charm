const BaseCharm = require('./BaseCharm');
/**
 * Clear Charm
 * Deletes a number of messages from a channel.
 *
 * Tier 1: $clear[10]
 * Tier 2: $clear[amount: 10]
 * Tier 3: $clear[{"amount": 10, "user": "@user"}]
 *
 * Arguments:
 * - amount (number, required): Number of messages to delete
 * - user (string, optional): Only delete messages from this user
 */
class ClearCharm extends BaseCharm {
  async execute(args, context) {
    try {
      const options = this.parse(args);
      const amount = parseInt(options.amount || args);
      if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
        return this.reply(context, { content: '❌ Please specify a valid amount (1-100).' });
      }
      let messages = await context.message.channel.messages.fetch({ limit: amount });
      if (options.user) {
        const userId = options.user.replace(/[<@!>]/g, '');
        messages = messages.filter(m => m.author.id === userId);
      }
      await context.message.channel.bulkDelete(messages, true);
      await this.reply(context, { content: `✅ Deleted ${messages.size} messages.` });
    } catch (error) {
      await this.reply(context, { content: '❌ Error: ' + error.message });
      throw error;
    }
  }
}
module.exports = ClearCharm; 