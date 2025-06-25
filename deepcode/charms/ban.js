const { PermissionsBitField } = require('discord.js');
const BaseCharm = require('./BaseCharm');

/**
 * Ban Charm
 * Bans a user from the server.
 *
 * TIER 1: $ban[@user]
 * TIER 2: $ban[{ "user": "@user", "reason": "Spam" }]
 * TIER 3: $ban[{ "user": "123456789", "reason": "Rule violation", "days": 7 }]
 */
class BanCharm extends BaseCharm {
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
            if (!context.message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return this.reply(context, { content: '❌ You do not have permission to ban members.', ephemeral: true });
            }

            // Parse arguments
            const options = this.parseBanArgs(args);
            if (!options.user) {
                return this.reply(context, { content: '⚠️ You must specify a user to ban.', ephemeral: true });
            }

            // Find the member to ban
            const memberToBan = await this.findMember(context.message.guild, options.user);
            if (!memberToBan) {
                return this.reply(context, { content: '❌ Could not find the specified user.', ephemeral: true });
            }

            if (!memberToBan.bannable) {
                return this.reply(context, { content: '❌ I cannot ban this user. They may have a higher role.', ephemeral: true });
            }

            // Ban the member
            await memberToBan.ban({
                reason: options.reason,
                deleteMessageSeconds: (options.days || 0) * 86400, // Convert days to seconds
            });

            // Send confirmation
            await this.reply(context, { content: `✅ Successfully banned ${memberToBan.user.tag}.` });

        } catch (error) {
            console.error('Error executing ban charm:', error);
            await this.reply(context, { content: '❌ An error occurred while trying to ban the user.', ephemeral: true }).catch(() => {});
            throw error;
        }
    }

    /**
     * Custom parser for ban arguments.
     * @param {any} args - The raw arguments.
     * @returns {{ user?: string, reason?: string, days?: number }}
     */
    parseBanArgs(args) {
        const defaults = { reason: 'No reason provided', days: 0 };

        if (typeof args === 'string') {
            return { ...defaults, user: args };
        }

        if (typeof args === 'object' && args !== null) {
            return { ...defaults, ...args };
        }

        return defaults;
    }

    /**
     * Finds a guild member from a string (ID or mention).
     * @param {Guild} guild - The guild to search in.
     * @param {string} userString - The user ID or mention.
     * @returns {Promise<GuildMember|null>}
     */
    async findMember(guild, userString) {
        const userId = userString.replace(/[<@!>]/g, '');
        try {
            return await guild.members.fetch(userId);
        } catch (error) {
            return null;
        }
    }
}

module.exports = BanCharm;
