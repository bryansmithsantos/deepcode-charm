/**
 * Slowmode charm - Configure channel slowmode settings
 * Tier 1 primitive for channel moderation
 */
module.exports = {
    name: 'slowmode',
    description: 'Configure channel slowmode settings',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $slowmode[30s]
        if (typeof args === 'string') {
            const duration = this.parseDuration(args);
            return await this.setSlowmode(context.message.channel, duration, context);
        }

        const { 
            action = 'set', 
            duration = '0s', 
            channel = context.message.channel.id,
            reason = 'Slowmode updated via bot'
        } = args;

        // Get target channel
        const targetChannel = await this.getChannel(context, channel);
        if (!targetChannel) {
            throw new Error('Channel not found');
        }

        switch (action.toLowerCase()) {
            case 'set':
                const durationSeconds = this.parseDuration(duration);
                return await this.setSlowmode(targetChannel, durationSeconds, context, reason);

            case 'get':
                return this.getSlowmode(targetChannel);

            case 'disable':
            case 'off':
                return await this.setSlowmode(targetChannel, 0, context, reason);

            case 'enable':
            case 'on':
                const defaultDuration = this.parseDuration(duration) || 30;
                return await this.setSlowmode(targetChannel, defaultDuration, context, reason);

            default:
                throw new Error(`Unknown slowmode action: ${action}`);
        }
    },

    /**
     * Set slowmode for a channel
     */
    async setSlowmode(channel, seconds, context, reason = 'Slowmode updated via bot') {
        try {
            // Validate permissions
            if (!context.message.member.permissions.has('MANAGE_CHANNELS')) {
                throw new Error('You do not have permission to manage channels');
            }

            // Validate channel type
            if (!channel.isTextBased() || channel.type === 1) { // Not DM
                throw new Error('Slowmode can only be set on text channels');
            }

            // Validate duration (0-21600 seconds = 6 hours max)
            if (seconds < 0 || seconds > 21600) {
                throw new Error('Slowmode duration must be between 0 and 21600 seconds (6 hours)');
            }

            // Set slowmode
            await channel.setRateLimitPerUser(seconds, reason);

            return {
                success: true,
                channel: channel.id,
                channelName: channel.name,
                duration: seconds,
                durationFormatted: this.formatDuration(seconds),
                message: seconds === 0 ? 
                    `Slowmode disabled in ${channel.name}` : 
                    `Slowmode set to ${this.formatDuration(seconds)} in ${channel.name}`
            };

        } catch (error) {
            throw new Error(`Failed to set slowmode: ${error.message}`);
        }
    },

    /**
     * Get current slowmode setting
     */
    getSlowmode(channel) {
        const seconds = channel.rateLimitPerUser || 0;
        
        return {
            channel: channel.id,
            channelName: channel.name,
            duration: seconds,
            durationFormatted: this.formatDuration(seconds),
            enabled: seconds > 0
        };
    },

    /**
     * Get channel from context
     */
    async getChannel(context, channelInput) {
        // If it's already a channel object
        if (channelInput && typeof channelInput === 'object' && channelInput.id) {
            return channelInput;
        }

        // Extract channel ID from mention or use directly
        const channelId = channelInput.toString().replace(/[<#>]/g, '');
        
        try {
            return await context.client.channels.fetch(channelId);
        } catch {
            return null;
        }
    },

    /**
     * Parse duration string to seconds
     */
    parseDuration(duration) {
        if (!duration) return 0;
        
        // If it's already a number, return it
        if (typeof duration === 'number') {
            return Math.max(0, Math.min(21600, Math.floor(duration)));
        }

        // Parse string format (e.g., "30s", "5m", "1h")
        const match = duration.toString().match(/^(\d+)([smh]?)$/i);
        if (!match) return 0;

        const [, amount, unit] = match;
        const num = parseInt(amount);

        switch (unit.toLowerCase()) {
            case 's':
            case '':
                return Math.max(0, Math.min(21600, num));
            case 'm':
                return Math.max(0, Math.min(21600, num * 60));
            case 'h':
                return Math.max(0, Math.min(21600, num * 3600));
            default:
                return 0;
        }
    },

    /**
     * Format duration from seconds to readable string
     */
    formatDuration(seconds) {
        if (seconds === 0) return 'disabled';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);

        return parts.join(' ') || '0s';
    }
};
