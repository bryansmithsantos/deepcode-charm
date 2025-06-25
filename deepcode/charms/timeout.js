const { PermissionsBitField } = require('discord.js');
const BaseCharm = require('./BaseCharm');

/**
 * Timeout Charm
 * Applies timeout to a user using Discord's native timeout feature.
 * Tier 1 primitive for moderation
 *
 * TIER 1: $timeout[@user, 10m]
 * TIER 2: $timeout[{ "user": "@user", "duration": "10m", "reason": "Spam" }]
 * TIER 3: $timeout[{ "user": "123456789", "duration": "1h", "reason": "Rule violation" }]
 */
class TimeoutCharm extends BaseCharm {
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
            if (!context.message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return this.reply(context, { content: '❌ You do not have permission to timeout members.', ephemeral: true });
            }

            // Parse arguments
            const options = this.parseTimeoutArgs(args);
            if (!options.user) {
                return this.reply(context, { content: '⚠️ You must specify a user to timeout.', ephemeral: true });
            }

            // Find the member to timeout
            const memberToTimeout = await this.findMember(context.message.guild, options.user);
            if (!memberToTimeout) {
                return this.reply(context, { content: '❌ Could not find the specified user.', ephemeral: true });
            }

            if (!memberToTimeout.moderatable) {
                return this.reply(context, { content: '❌ I cannot timeout this user. They may have a higher role.', ephemeral: true });
            }

            // Parse duration
            const durationMs = this.parseDuration(options.duration);
            if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) { // 28 days max
                return this.reply(context, { content: '❌ Invalid duration. Maximum is 28 days.', ephemeral: true });
            }

            // Apply timeout
            await memberToTimeout.timeout(durationMs, options.reason);

            // Send confirmation
            const durationText = this.formatDuration(durationMs);
            await this.reply(context, { content: `✅ Successfully timed out ${memberToTimeout.user.tag} for ${durationText}.` });

        } catch (error) {
            console.error('Error executing timeout charm:', error);
            await this.reply(context, { content: '❌ An error occurred while trying to timeout the user.', ephemeral: true }).catch(() => {});
            throw error;
        }
    }

    /**
     * Custom parser for timeout arguments.
     * @param {any} args - The raw arguments.
     * @returns {{ user?: string, duration?: string, reason?: string }}
     */
    parseTimeoutArgs(args) {
        const defaults = { reason: 'No reason provided', duration: '10m' };

        // Handle simple format: $timeout[@user, 10m]
        if (typeof args === 'string' && args.includes(',')) {
            const parts = args.split(',').map(p => p.trim());
            return { 
                ...defaults, 
                user: parts[0], 
                duration: parts[1] || defaults.duration 
            };
        }

        if (typeof args === 'string') {
            return { ...defaults, user: args };
        }

        if (typeof args === 'object' && args !== null) {
            return { ...defaults, ...args };
        }

        return defaults;
    }

    /**
     * Parse duration string to milliseconds
     * @param {string} duration - Duration string (e.g., "10m", "1h", "2d")
     * @returns {number} Duration in milliseconds
     */
    parseDuration(duration) {
        if (!duration) return 10 * 60 * 1000; // Default 10 minutes

        const match = duration.match(/^(\d+)([smhd])$/i);
        if (!match) return null;

        const [, amount, unit] = match;
        const num = parseInt(amount);

        switch (unit.toLowerCase()) {
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }

    /**
     * Format duration from milliseconds to readable string
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        return `${seconds} second${seconds > 1 ? 's' : ''}`;
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

module.exports = TimeoutCharm;
