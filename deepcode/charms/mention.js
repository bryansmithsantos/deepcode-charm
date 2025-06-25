/**
 * Mention charm - Create and validate mentions for users, roles, channels
 * Tier 1 primitive for mention operations
 */
module.exports = {
    name: 'mention',
    description: 'Create and validate mentions for users, roles, channels',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $mention[user, 123456789]
        if (typeof args === 'string' && args.includes(',')) {
            const [type, id] = args.split(',').map(s => s.trim());
            return this.createMention(type, id);
        }

        // Handle single ID: $mention[123456789] (defaults to user)
        if (typeof args === 'string') {
            return this.createMention('user', args);
        }

        const { action = 'create', type = 'user', target, format = 'mention' } = args;

        switch (action.toLowerCase()) {
            case 'create':
                return this.createMention(type, target);

            case 'parse':
                return this.parseMention(target);

            case 'validate':
                return this.validateMention(target, context);

            case 'extract':
                return this.extractMentions(target, type);

            case 'clean':
                return this.cleanMentions(target);

            default:
                throw new Error(`Unknown mention action: ${action}`);
        }
    },

    /**
     * Create mention string
     */
    createMention(type, target) {
        if (!target) {
            throw new Error('Target ID is required for mention creation');
        }

        // Clean target ID (remove existing mention formatting)
        const id = target.toString().replace(/[<@&#!>]/g, '');

        switch (type.toLowerCase()) {
            case 'user':
            case 'member':
                return `<@${id}>`;

            case 'usernick':
            case 'nickname':
                return `<@!${id}>`;

            case 'role':
                return `<@&${id}>`;

            case 'channel':
                return `<#${id}>`;

            case 'slash':
            case 'command':
                return `</${target}>`;

            case 'emoji':
                // Format: <:name:id> or <a:name:id>
                if (target.includes(':')) {
                    return `<:${target}>`;
                }
                return `<:emoji:${id}>`;

            case 'timestamp':
                // Unix timestamp mention
                return `<t:${id}>`;

            case 'timestamprelative':
                return `<t:${id}:R>`;

            case 'everyone':
                return '@everyone';

            case 'here':
                return '@here';

            default:
                throw new Error(`Unknown mention type: ${type}`);
        }
    },

    /**
     * Parse mention to extract ID and type
     */
    parseMention(mention) {
        if (!mention || typeof mention !== 'string') {
            return null;
        }

        // User mention patterns
        const userMatch = mention.match(/^<@!?(\d+)>$/);
        if (userMatch) {
            return {
                type: 'user',
                id: userMatch[1],
                nickname: mention.includes('!')
            };
        }

        // Role mention
        const roleMatch = mention.match(/^<@&(\d+)>$/);
        if (roleMatch) {
            return {
                type: 'role',
                id: roleMatch[1]
            };
        }

        // Channel mention
        const channelMatch = mention.match(/^<#(\d+)>$/);
        if (channelMatch) {
            return {
                type: 'channel',
                id: channelMatch[1]
            };
        }

        // Slash command mention
        const slashMatch = mention.match(/^<\/(.+):(\d+)>$/);
        if (slashMatch) {
            return {
                type: 'slash',
                name: slashMatch[1],
                id: slashMatch[2]
            };
        }

        // Emoji mention
        const emojiMatch = mention.match(/^<(a?):(.+):(\d+)>$/);
        if (emojiMatch) {
            return {
                type: 'emoji',
                animated: emojiMatch[1] === 'a',
                name: emojiMatch[2],
                id: emojiMatch[3]
            };
        }

        // Timestamp mention
        const timestampMatch = mention.match(/^<t:(\d+)(:([RDTtFf]))?>$/);
        if (timestampMatch) {
            return {
                type: 'timestamp',
                timestamp: timestampMatch[1],
                format: timestampMatch[3] || 'f'
            };
        }

        // Special mentions
        if (mention === '@everyone') {
            return { type: 'everyone' };
        }
        if (mention === '@here') {
            return { type: 'here' };
        }

        return null;
    },

    /**
     * Validate mention exists in context
     */
    async validateMention(mention, context) {
        const parsed = this.parseMention(mention);
        if (!parsed) {
            return false;
        }

        try {
            switch (parsed.type) {
                case 'user':
                    const user = await context.client.users.fetch(parsed.id);
                    return !!user;

                case 'role':
                    const role = context.message.guild?.roles.cache.get(parsed.id);
                    return !!role;

                case 'channel':
                    const channel = context.client.channels.cache.get(parsed.id);
                    return !!channel;

                case 'emoji':
                    const emoji = context.client.emojis.cache.get(parsed.id);
                    return !!emoji;

                case 'everyone':
                case 'here':
                case 'timestamp':
                case 'slash':
                    return true; // These are always valid if properly formatted

                default:
                    return false;
            }
        } catch {
            return false;
        }
    },

    /**
     * Extract all mentions from text
     */
    extractMentions(text, filterType = null) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const mentions = [];
        
        // All mention patterns
        const patterns = [
            { regex: /<@!?(\d+)>/g, type: 'user' },
            { regex: /<@&(\d+)>/g, type: 'role' },
            { regex: /<#(\d+)>/g, type: 'channel' },
            { regex: /<\/(.+):(\d+)>/g, type: 'slash' },
            { regex: /<(a?):(.+):(\d+)>/g, type: 'emoji' },
            { regex: /<t:(\d+)(:([RDTtFf]))?>/g, type: 'timestamp' }
        ];

        for (const pattern of patterns) {
            if (filterType && pattern.type !== filterType) continue;

            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                const parsed = this.parseMention(match[0]);
                if (parsed) {
                    mentions.push({
                        ...parsed,
                        raw: match[0],
                        index: match.index
                    });
                }
            }
        }

        // Check for @everyone and @here
        if (!filterType || filterType === 'everyone') {
            if (text.includes('@everyone')) {
                mentions.push({
                    type: 'everyone',
                    raw: '@everyone',
                    index: text.indexOf('@everyone')
                });
            }
        }

        if (!filterType || filterType === 'here') {
            if (text.includes('@here')) {
                mentions.push({
                    type: 'here',
                    raw: '@here',
                    index: text.indexOf('@here')
                });
            }
        }

        return mentions.sort((a, b) => a.index - b.index);
    },

    /**
     * Remove all mentions from text
     */
    cleanMentions(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/<@!?\d+>/g, '') // User mentions
            .replace(/<@&\d+>/g, '') // Role mentions
            .replace(/<#\d+>/g, '') // Channel mentions
            .replace(/<\/[^:]+:\d+>/g, '') // Slash command mentions
            .replace(/<a?:[^:]+:\d+>/g, '') // Emoji mentions
            .replace(/<t:\d+(:([RDTtFf]))?>/g, '') // Timestamp mentions
            .replace(/@everyone/g, '') // @everyone
            .replace(/@here/g, '') // @here
            .replace(/\s+/g, ' ') // Clean up extra spaces
            .trim();
    }
};
