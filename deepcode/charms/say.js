const BaseCharm = require('./BaseCharm');

/**
 * Say Charm
 * Sends a message to the channel.
 *
 * TIER 1: $say[Hello world]
 * TIER 2: $say[{ "content": "Hello", "tts": true }]
 * TIER 3: $say[{ "embeds": [{ "title": "My Embed" }] }]
 */
class SayCharm extends BaseCharm {
    constructor(client) {
        super(client);
    }

    /**
     * @param {any} args - The arguments for the charm.
     * @param {object} context - The execution context.
     */
    async execute(args, context) {
        try {
            // Parse arguments based on tiered syntax
            const options = this.parse(args);

            // Send the message
            await this.reply(context, options);

        } catch (error) {
            console.error('Error executing say charm:', error);
            // Optionally, send an error message back to the user
            await this.reply(context, {
                content: '❌ Error executing the say command.',
                ephemeral: true
            }).catch(() => {}); // Ignore errors on the error reply
            throw error;
        }
    }
}

module.exports = SayCharm;
