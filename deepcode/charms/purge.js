const { PermissionsBitField } = require('discord.js');
const BaseCharm = require('./BaseCharm');

/**
 * Purge Charm
 * Deletes a specified number of messages from a channel.
 *
 * TIER 1: $purge[10] - Deletes the last 10 messages.
 * TIER 2: $purge[{ "amount": 10, "user": "123456789" }] - Deletes messages from a specific user.
 * TIER 3: $purge[{ "amount": 50, "filter": "bots" }] - Deletes messages from bots.
 */
class PurgeCharm extends BaseCharm {
    constructor(client) {
        super(client);
    }

    /**
     * @param {any} args - The arguments for the charm.
     * @param {object} context - The execution context.
     */
    async execute(args, context) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return this.reply(context, { content: '❌ You do not have permission to manage messages.', ephemeral: true });
            }

            // Parse arguments
            const options = this.parsePurgeArgs(args);

            if (options.amount <= 0) {
                return this.reply(context, { content: '⚠️ Please provide a number greater than 0.', ephemeral: true });
            }
            if (options.amount > 100) {
                return this.reply(context, { content: '⚠️ You can only delete up to 100 messages at a time.', ephemeral: true });
            }

            // Fetch and delete messages
            const messages = await context.message.channel.messages.fetch({ limit: options.amount });
            let filteredMessages = messages;

            if (options.user) {
                const targetUser = await this.client.users.fetch(options.user);
                if (targetUser) {
                    filteredMessages = messages.filter(m => m.author.id === targetUser.id);
                }
            } else if (options.filter === 'bots') {
                filteredMessages = messages.filter(m => m.author.bot);
            }

            if (filteredMessages.size === 0) {
                return this.reply(context, { content: '✅ No messages found to delete.', ephemeral: true });
            }

            await context.message.channel.bulkDelete(filteredMessages, true);

            // Send confirmation
            const confirmation = await this.reply(context, { content: `✅ Successfully deleted ${filteredMessages.size} messages.` });
            setTimeout(() => confirmation.delete().catch(() => {}), 5000); // Delete confirmation after 5s

        } catch (error) {
            console.error('Error executing purge charm:', error);
            await this.reply(context, { content: '❌ An error occurred while trying to purge messages.', ephemeral: true }).catch(() => {});
            throw error;
        }
    }

    /**
     * Custom parser for purge arguments.
     * @param {any} args - The raw arguments.
     * @returns {{ amount: number, user?: string, filter?: string }}
     */
    parsePurgeArgs(args) {
        const defaults = { amount: 0 };

        if (typeof args === 'number' || (typeof args === 'string' && !isNaN(parseInt(args)))) {
            return { ...defaults, amount: parseInt(args) };
        }

        if (typeof args === 'object' && args !== null) {
            const amount = parseInt(args.amount) || 0;
            return { ...defaults, ...args, amount };
        }

        return defaults;
    }
}

module.exports = PurgeCharm;
