/**
 * Reaction charm - Manage message reactions
 * Tier 2 primitive for reaction operations
 * 
 * Examples:
 * $reaction[add, { "emoji": "👍", "message": "123456789" }] - Add reaction
 * $reaction[remove, { "emoji": "👎", "user": "123456789" }] - Remove reaction
 * $reaction[list, "123456789"] - List all reactions on message
 */
module.exports = {
    name: 'reaction',
    description: 'Manage message reactions',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $reaction[👍] (add reaction to current message)
        if (typeof args === 'string') {
            return await this.addReaction(args, context.message.id, context);
        }

        const { 
            action = 'add',
            emoji,
            message = context.message.id,
            user,
            channel
        } = args;

        switch (action.toLowerCase()) {
            case 'add':
                return await this.addReaction(emoji, message, context, channel);

            case 'remove':
                return await this.removeReaction(emoji, message, context, user, channel);

            case 'clear':
                return await this.clearReactions(message, context, emoji, channel);

            case 'list':
                return await this.listReactions(message, context, channel);

            case 'count':
                return await this.countReactions(message, context, emoji, channel);

            case 'users':
                return await this.getReactionUsers(emoji, message, context, channel);

            case 'toggle':
                return await this.toggleReaction(emoji, message, context, channel);

            default:
                throw new Error(`Unknown reaction action: ${action}`);
        }
    },

    /**
     * Add reaction to message
     */
    async addReaction(emoji, messageId, context, channelId) {
        try {
            if (!emoji) {
                throw new Error('Emoji is required');
            }

            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            // Check permissions
            if (!targetMessage.channel.permissionsFor(context.message.member).has('ADD_REACTIONS')) {
                throw new Error('You do not have permission to add reactions in this channel');
            }

            // Parse and add emoji
            const parsedEmoji = this.parseEmoji(emoji);
            await targetMessage.react(parsedEmoji);

            return {
                success: true,
                action: 'added',
                emoji: emoji,
                message: messageId,
                channel: targetMessage.channel.id
            };

        } catch (error) {
            throw new Error(`Failed to add reaction: ${error.message}`);
        }
    },

    /**
     * Remove reaction from message
     */
    async removeReaction(emoji, messageId, context, userId, channelId) {
        try {
            if (!emoji) {
                throw new Error('Emoji is required');
            }

            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            // Get reaction
            const reaction = targetMessage.reactions.cache.find(r => 
                this.matchesEmoji(r.emoji, emoji)
            );

            if (!reaction) {
                throw new Error('Reaction not found on message');
            }

            if (userId) {
                // Remove specific user's reaction
                const user = await context.client.users.fetch(userId);
                await reaction.users.remove(user);
            } else {
                // Remove bot's reaction
                await reaction.users.remove(context.client.user);
            }

            return {
                success: true,
                action: 'removed',
                emoji: emoji,
                message: messageId,
                user: userId || context.client.user.id
            };

        } catch (error) {
            throw new Error(`Failed to remove reaction: ${error.message}`);
        }
    },

    /**
     * Clear reactions from message
     */
    async clearReactions(messageId, context, emoji, channelId) {
        try {
            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            // Check permissions
            if (!targetMessage.channel.permissionsFor(context.message.member).has('MANAGE_MESSAGES')) {
                throw new Error('You do not have permission to manage reactions in this channel');
            }

            if (emoji) {
                // Clear specific emoji
                const reaction = targetMessage.reactions.cache.find(r => 
                    this.matchesEmoji(r.emoji, emoji)
                );

                if (reaction) {
                    await reaction.remove();
                }

                return {
                    success: true,
                    action: 'cleared',
                    emoji: emoji,
                    message: messageId
                };
            } else {
                // Clear all reactions
                await targetMessage.reactions.removeAll();

                return {
                    success: true,
                    action: 'cleared_all',
                    message: messageId
                };
            }

        } catch (error) {
            throw new Error(`Failed to clear reactions: ${error.message}`);
        }
    },

    /**
     * List all reactions on message
     */
    async listReactions(messageId, context, channelId) {
        try {
            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            const reactions = Array.from(targetMessage.reactions.cache.values()).map(reaction => ({
                emoji: {
                    name: reaction.emoji.name,
                    id: reaction.emoji.id,
                    animated: reaction.emoji.animated,
                    custom: !!reaction.emoji.id,
                    mention: reaction.emoji.toString()
                },
                count: reaction.count,
                me: reaction.me,
                users: reaction.partial ? 'partial' : Array.from(reaction.users.cache.values()).map(user => ({
                    id: user.id,
                    tag: user.tag,
                    username: user.username
                }))
            }));

            return reactions;

        } catch (error) {
            throw new Error(`Failed to list reactions: ${error.message}`);
        }
    },

    /**
     * Count reactions on message
     */
    async countReactions(messageId, context, emoji, channelId) {
        try {
            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            if (emoji) {
                // Count specific emoji
                const reaction = targetMessage.reactions.cache.find(r => 
                    this.matchesEmoji(r.emoji, emoji)
                );

                return reaction ? reaction.count : 0;
            } else {
                // Count all reactions
                return targetMessage.reactions.cache.reduce((total, reaction) => total + reaction.count, 0);
            }

        } catch (error) {
            throw new Error(`Failed to count reactions: ${error.message}`);
        }
    },

    /**
     * Get users who reacted with specific emoji
     */
    async getReactionUsers(emoji, messageId, context, channelId) {
        try {
            if (!emoji) {
                throw new Error('Emoji is required');
            }

            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            // Find reaction
            const reaction = targetMessage.reactions.cache.find(r => 
                this.matchesEmoji(r.emoji, emoji)
            );

            if (!reaction) {
                return [];
            }

            // Fetch users if partial
            if (reaction.partial) {
                await reaction.fetch();
            }

            const users = Array.from(reaction.users.cache.values()).map(user => ({
                id: user.id,
                tag: user.tag,
                username: user.username,
                bot: user.bot,
                avatar: user.displayAvatarURL()
            }));

            return users;

        } catch (error) {
            throw new Error(`Failed to get reaction users: ${error.message}`);
        }
    },

    /**
     * Toggle reaction (add if not present, remove if present)
     */
    async toggleReaction(emoji, messageId, context, channelId) {
        try {
            if (!emoji) {
                throw new Error('Emoji is required');
            }

            // Get target message
            const targetMessage = await this.getMessage(messageId, context, channelId);
            if (!targetMessage) {
                throw new Error('Message not found');
            }

            // Check if bot already reacted
            const reaction = targetMessage.reactions.cache.find(r => 
                this.matchesEmoji(r.emoji, emoji)
            );

            if (reaction && reaction.me) {
                // Remove reaction
                await reaction.users.remove(context.client.user);
                return {
                    success: true,
                    action: 'removed',
                    emoji: emoji,
                    message: messageId
                };
            } else {
                // Add reaction
                const parsedEmoji = this.parseEmoji(emoji);
                await targetMessage.react(parsedEmoji);
                return {
                    success: true,
                    action: 'added',
                    emoji: emoji,
                    message: messageId
                };
            }

        } catch (error) {
            throw new Error(`Failed to toggle reaction: ${error.message}`);
        }
    },

    /**
     * Get message by ID
     */
    async getMessage(messageId, context, channelId) {
        try {
            let targetChannel = context.message.channel;

            // Use specific channel if provided
            if (channelId) {
                const channelIdClean = channelId.toString().replace(/[<#>]/g, '');
                targetChannel = await context.client.channels.fetch(channelIdClean);
            }

            return await targetChannel.messages.fetch(messageId);
        } catch {
            return null;
        }
    },

    /**
     * Parse emoji string to usable format
     */
    parseEmoji(emoji) {
        if (typeof emoji === 'object') {
            return emoji;
        }

        const emojiString = emoji.toString();

        // Check if it's a custom emoji <:name:id> or <a:name:id>
        const customEmojiMatch = emojiString.match(/^<(a?):([^:]+):(\d+)>$/);
        if (customEmojiMatch) {
            return customEmojiMatch[3]; // Return just the ID for custom emojis
        }

        // Check if it's just an emoji ID
        if (/^\d+$/.test(emojiString)) {
            return emojiString;
        }

        // Return as-is for unicode emojis
        return emojiString;
    },

    /**
     * Check if emoji matches reaction emoji
     */
    matchesEmoji(reactionEmoji, targetEmoji) {
        const target = targetEmoji.toString();

        // Check by ID (for custom emojis)
        if (reactionEmoji.id && target.includes(reactionEmoji.id)) {
            return true;
        }

        // Check by name (for unicode and custom emojis)
        if (reactionEmoji.name === target) {
            return true;
        }

        // Check if target is the full emoji string
        if (reactionEmoji.toString() === target) {
            return true;
        }

        return false;
    }
};
