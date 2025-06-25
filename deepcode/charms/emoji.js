/**
 * Emoji charm - Manage custom emojis
 * Tier 2 primitive for emoji operations
 * 
 * Examples:
 * $emoji[create, { "name": "test", "url": "https://..." }] - Create emoji
 * $emoji[list] - List all emojis
 * $emoji[get, emojiName] - Get emoji info
 */
module.exports = {
    name: 'emoji',
    description: 'Manage custom emojis in the server',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $emoji[emojiName]
        if (typeof args === 'string') {
            return await this.getEmoji(args, context);
        }

        const { action = 'get', name, url, reason = 'Emoji managed via bot', format = 'string' } = args;

        switch (action.toLowerCase()) {
            case 'create':
            case 'add':
                return await this.createEmoji(name, url, context, reason);

            case 'delete':
            case 'remove':
                return await this.deleteEmoji(name, context, reason);

            case 'list':
                return await this.listEmojis(context, format);

            case 'get':
            case 'info':
                return await this.getEmoji(name, context);

            case 'edit':
            case 'rename':
                return await this.editEmoji(name, args, context, reason);

            default:
                throw new Error(`Unknown emoji action: ${action}`);
        }
    },

    /**
     * Create custom emoji
     */
    async createEmoji(name, url, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
                throw new Error('You do not have permission to manage emojis');
            }

            if (!name || !url) {
                throw new Error('Emoji name and URL are required');
            }

            // Validate name
            if (!/^[a-zA-Z0-9_]{2,32}$/.test(name)) {
                throw new Error('Emoji name must be 2-32 characters and contain only letters, numbers, and underscores');
            }

            const guild = context.message.guild;
            const emoji = await guild.emojis.create({
                attachment: url,
                name: name,
                reason: reason
            });

            return {
                success: true,
                emoji: {
                    id: emoji.id,
                    name: emoji.name,
                    url: emoji.url,
                    animated: emoji.animated,
                    mention: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`,
                    createdAt: emoji.createdAt
                }
            };

        } catch (error) {
            throw new Error(`Failed to create emoji: ${error.message}`);
        }
    },

    /**
     * Delete custom emoji
     */
    async deleteEmoji(name, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
                throw new Error('You do not have permission to manage emojis');
            }

            const guild = context.message.guild;
            const emoji = guild.emojis.cache.find(e => e.name === name || e.id === name);

            if (!emoji) {
                throw new Error('Emoji not found');
            }

            await emoji.delete(reason);

            return {
                success: true,
                deletedEmoji: {
                    id: emoji.id,
                    name: emoji.name,
                    animated: emoji.animated
                }
            };

        } catch (error) {
            throw new Error(`Failed to delete emoji: ${error.message}`);
        }
    },

    /**
     * List all custom emojis
     */
    async listEmojis(context, format) {
        try {
            const guild = context.message.guild;
            const emojis = Array.from(guild.emojis.cache.values());

            const emojiList = emojis.map(emoji => ({
                id: emoji.id,
                name: emoji.name,
                url: emoji.url,
                animated: emoji.animated,
                mention: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`,
                createdAt: emoji.createdAt,
                author: emoji.author?.tag || 'Unknown'
            }));

            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(emojiList);
                case 'count':
                    return emojiList.length;
                case 'names':
                    return emojiList.map(e => e.name);
                case 'mentions':
                    return emojiList.map(e => e.mention);
                case 'urls':
                    return emojiList.map(e => e.url);
                case 'array':
                default:
                    return emojiList;
            }

        } catch (error) {
            throw new Error(`Failed to list emojis: ${error.message}`);
        }
    },

    /**
     * Get specific emoji info
     */
    async getEmoji(name, context) {
        try {
            const guild = context.message.guild;
            const emoji = guild.emojis.cache.find(e => e.name === name || e.id === name);

            if (!emoji) {
                throw new Error('Emoji not found');
            }

            return {
                id: emoji.id,
                name: emoji.name,
                url: emoji.url,
                animated: emoji.animated,
                mention: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`,
                createdAt: emoji.createdAt,
                author: emoji.author?.tag || 'Unknown',
                guild: {
                    id: emoji.guild.id,
                    name: emoji.guild.name
                }
            };

        } catch (error) {
            throw new Error(`Failed to get emoji: ${error.message}`);
        }
    },

    /**
     * Edit emoji (rename)
     */
    async editEmoji(name, options, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) {
                throw new Error('You do not have permission to manage emojis');
            }

            const { newName } = options;
            if (!newName) {
                throw new Error('New name is required for emoji edit');
            }

            // Validate new name
            if (!/^[a-zA-Z0-9_]{2,32}$/.test(newName)) {
                throw new Error('Emoji name must be 2-32 characters and contain only letters, numbers, and underscores');
            }

            const guild = context.message.guild;
            const emoji = guild.emojis.cache.find(e => e.name === name || e.id === name);

            if (!emoji) {
                throw new Error('Emoji not found');
            }

            const editedEmoji = await emoji.edit({ name: newName }, reason);

            return {
                success: true,
                emoji: {
                    id: editedEmoji.id,
                    oldName: name,
                    newName: editedEmoji.name,
                    url: editedEmoji.url,
                    animated: editedEmoji.animated,
                    mention: `<${editedEmoji.animated ? 'a' : ''}:${editedEmoji.name}:${editedEmoji.id}>`
                }
            };

        } catch (error) {
            throw new Error(`Failed to edit emoji: ${error.message}`);
        }
    }
};
