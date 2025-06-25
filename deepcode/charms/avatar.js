/**
 * Avatar charm - Get user and server avatars
 * Tier 1 primitive for basic user information
 * 
 * Examples:
 * $avatar[$$mention] - Get user avatar
 * $avatar[{ "type": "server" }] - Get server icon
 * $avatar[{ "type": "user", "target": "123456789", "size": 1024 }] - Custom size
 */
module.exports = {
    name: 'avatar',
    description: 'Get user and server avatar URLs',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $avatar[$$mention]
        if (typeof args === 'string') {
            return await this.getUserAvatar(args, context);
        }

        const { type = 'user', target, size = 512, format = 'png', dynamic = true } = args;

        switch (type.toLowerCase()) {
            case 'user':
                return await this.getUserAvatar(target || context.message.author.id, context, { size, format, dynamic });

            case 'server':
            case 'guild':
                return await this.getServerAvatar(context, { size, format, dynamic });

            case 'bot':
                return await this.getBotAvatar(context, { size, format, dynamic });

            default:
                throw new Error(`Unknown avatar type: ${type}`);
        }
    },

    /**
     * Get user avatar URL
     */
    async getUserAvatar(userInput, context, options = {}) {
        const { size = 512, format = 'png', dynamic = true } = options;
        
        try {
            // Extract user ID from mention or use directly
            const userId = userInput.toString().replace(/[<@!>]/g, '');
            
            // Try to get user from guild first, then fetch from Discord
            let user;
            try {
                const member = await context.message.guild.members.fetch(userId);
                user = member.user;
            } catch {
                user = await context.client.users.fetch(userId);
            }

            if (!user) {
                throw new Error('User not found');
            }

            // Get avatar URL with options
            const avatarURL = user.displayAvatarURL({
                size: this.validateSize(size),
                format: dynamic && user.avatar?.startsWith('a_') ? 'gif' : format,
                dynamic
            });

            return avatarURL;

        } catch (error) {
            throw new Error(`Failed to get user avatar: ${error.message}`);
        }
    },

    /**
     * Get server/guild avatar URL
     */
    async getServerAvatar(context, options = {}) {
        const { size = 512, format = 'png', dynamic = true } = options;
        
        try {
            const guild = context.message.guild;
            if (!guild) {
                throw new Error('Command must be used in a server');
            }

            if (!guild.iconURL()) {
                return null; // Server has no icon
            }

            return guild.iconURL({
                size: this.validateSize(size),
                format: dynamic && guild.icon?.startsWith('a_') ? 'gif' : format,
                dynamic
            });

        } catch (error) {
            throw new Error(`Failed to get server avatar: ${error.message}`);
        }
    },

    /**
     * Get bot avatar URL
     */
    async getBotAvatar(context, options = {}) {
        const { size = 512, format = 'png', dynamic = true } = options;
        
        try {
            const bot = context.client.user;
            
            return bot.displayAvatarURL({
                size: this.validateSize(size),
                format: dynamic && bot.avatar?.startsWith('a_') ? 'gif' : format,
                dynamic
            });

        } catch (error) {
            throw new Error(`Failed to get bot avatar: ${error.message}`);
        }
    },

    /**
     * Validate avatar size (must be power of 2, between 16 and 4096)
     */
    validateSize(size) {
        const validSizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
        const numSize = parseInt(size);
        
        if (!validSizes.includes(numSize)) {
            return 512; // Default size
        }
        
        return numSize;
    }
};
