/**
 * User charm - Get user information and properties
 * Tier 1 primitive for user data access
 */
module.exports = {
    name: 'user',
    description: 'Get user information and properties',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $user[$$mention]
        if (typeof args === 'string') {
            return await this.getUserInfo(args, context, 'tag');
        }

        const { target, property = 'tag', format = 'string' } = args;
        const userInput = target || context.message.author.id;

        return await this.getUserInfo(userInput, context, property, format);
    },

    /**
     * Get user information
     */
    async getUserInfo(userInput, context, property, format = 'string') {
        try {
            // Extract user ID from mention or use directly
            const userId = userInput.toString().replace(/[<@!>]/g, '');
            
            // Try to get member from guild first, then user from Discord
            let user, member;
            try {
                member = await context.message.guild.members.fetch(userId);
                user = member.user;
            } catch {
                user = await context.client.users.fetch(userId);
                member = null;
            }

            if (!user) {
                throw new Error('User not found');
            }

            // Get requested property
            const result = this.getUserProperty(user, member, property);
            
            // Format result if needed
            return this.formatResult(result, format);

        } catch (error) {
            throw new Error(`Failed to get user info: ${error.message}`);
        }
    },

    /**
     * Get specific user property
     */
    getUserProperty(user, member, property) {
        switch (property.toLowerCase()) {
            // Basic user properties
            case 'id':
                return user.id;
            case 'tag':
                return user.tag;
            case 'username':
                return user.username;
            case 'discriminator':
                return user.discriminator;
            case 'displayname':
                return user.displayName;
            case 'globalname':
                return user.globalName;

            // Avatar and visual
            case 'avatar':
                return user.displayAvatarURL({ size: 512 });
            case 'avatarurl':
                return user.avatarURL();
            case 'defaultavatar':
                return user.defaultAvatarURL;

            // Status and presence
            case 'bot':
                return user.bot;
            case 'system':
                return user.system;

            // Timestamps
            case 'created':
            case 'createdat':
                return user.createdAt;
            case 'createdtimestamp':
                return user.createdTimestamp;

            // Member-specific properties (if in guild)
            case 'nickname':
                return member?.nickname || null;
            case 'displayname':
                return member?.displayName || user.displayName;
            case 'joined':
            case 'joinedat':
                return member?.joinedAt || null;
            case 'joinedtimestamp':
                return member?.joinedTimestamp || null;
            case 'premiumsince':
                return member?.premiumSince || null;
            case 'roles':
                return member?.roles.cache.map(role => role.name) || [];
            case 'rolecount':
                return member?.roles.cache.size || 0;
            case 'toprole':
                return member?.roles.highest.name || null;
            case 'color':
                return member?.displayHexColor || '#000000';
            case 'permissions':
                return member?.permissions.toArray() || [];

            // Mention formats
            case 'mention':
                return `<@${user.id}>`;
            case 'mentionnick':
                return `<@!${user.id}>`;

            // Status
            case 'status':
                return member?.presence?.status || 'offline';
            case 'activity':
                return member?.presence?.activities[0]?.name || null;

            // Flags
            case 'flags':
                return user.flags?.toArray() || [];
            case 'publicflags':
                return user.publicFlags?.toArray() || [];

            default:
                throw new Error(`Unknown user property: ${property}`);
        }
    },

    /**
     * Format result based on requested format
     */
    formatResult(result, format) {
        switch (format.toLowerCase()) {
            case 'string':
                if (Array.isArray(result)) {
                    return result.join(', ');
                }
                return result?.toString() || '';

            case 'array':
                if (Array.isArray(result)) {
                    return result;
                }
                return [result];

            case 'json':
                return JSON.stringify(result);

            case 'count':
                if (Array.isArray(result)) {
                    return result.length;
                }
                return result ? 1 : 0;

            case 'boolean':
                return Boolean(result);

            case 'timestamp':
                if (result instanceof Date) {
                    return Math.floor(result.getTime() / 1000);
                }
                return result;

            case 'relative':
                if (result instanceof Date) {
                    return `<t:${Math.floor(result.getTime() / 1000)}:R>`;
                }
                return result;

            default:
                return result;
        }
    }
};
