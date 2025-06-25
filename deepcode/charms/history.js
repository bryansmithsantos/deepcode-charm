/**
 * History charm - Message and channel history operations
 * Tier 2 primitive for accessing message history
 * 
 * Examples:
 * $history[messages, { "limit": 50 }] - Get recent messages
 * $history[user, { "user": "123456789", "limit": 10 }] - Get user's messages
 * $history[search, { "query": "hello", "limit": 20 }] - Search messages
 */
module.exports = {
    name: 'history',
    description: 'Message and channel history operations',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $history[50] (get 50 messages)
        if (typeof args === 'string' || typeof args === 'number') {
            const limit = parseInt(args) || 50;
            return await this.getMessages(context, { limit });
        }

        const { 
            action = 'messages',
            limit = 50,
            before,
            after,
            around,
            user,
            channel,
            query,
            format = 'array'
        } = args;

        switch (action.toLowerCase()) {
            case 'messages':
            case 'get':
                return await this.getMessages(context, args);

            case 'user':
                return await this.getUserMessages(user, context, args);

            case 'search':
                return await this.searchMessages(query, context, args);

            case 'between':
                return await this.getMessagesBetween(after, before, context, args);

            case 'around':
                return await this.getMessagesAround(around, context, args);

            case 'count':
                return await this.countMessages(context, args);

            case 'stats':
                return await this.getChannelStats(context, args);

            default:
                throw new Error(`Unknown history action: ${action}`);
        }
    },

    /**
     * Get messages from channel
     */
    async getMessages(context, options = {}) {
        try {
            const { 
                limit = 50, 
                before, 
                after, 
                around,
                channel,
                format = 'array'
            } = options;

            // Get target channel
            const targetChannel = await this.getChannel(context, channel || context.message.channel.id);
            if (!targetChannel) {
                throw new Error('Channel not found');
            }

            // Check permissions
            if (!targetChannel.permissionsFor(context.message.member).has('READ_MESSAGE_HISTORY')) {
                throw new Error('You do not have permission to read message history in this channel');
            }

            // Build fetch options
            const fetchOptions = { 
                limit: Math.min(100, Math.max(1, limit))
            };

            if (before) fetchOptions.before = before;
            if (after) fetchOptions.after = after;
            if (around) fetchOptions.around = around;

            // Fetch messages
            const messages = await targetChannel.messages.fetch(fetchOptions);
            const messageArray = Array.from(messages.values())
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

            // Format messages
            const formattedMessages = messageArray.map(msg => this.formatMessage(msg));

            return this.formatOutput(formattedMessages, format);

        } catch (error) {
            throw new Error(`Failed to get messages: ${error.message}`);
        }
    },

    /**
     * Get messages from specific user
     */
    async getUserMessages(userId, context, options = {}) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const messages = await this.getMessages(context, options);
        const userMessages = Array.isArray(messages) ? 
            messages.filter(msg => msg.author.id === userId) : 
            [];

        return this.formatOutput(userMessages, options.format || 'array');
    },

    /**
     * Search messages by content
     */
    async searchMessages(query, context, options = {}) {
        if (!query) {
            throw new Error('Search query is required');
        }

        const { caseSensitive = false, regex = false } = options;
        const messages = await this.getMessages(context, options);
        
        let filteredMessages;
        if (Array.isArray(messages)) {
            if (regex) {
                const regexPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
                filteredMessages = messages.filter(msg => regexPattern.test(msg.content));
            } else {
                const searchQuery = caseSensitive ? query : query.toLowerCase();
                filteredMessages = messages.filter(msg => {
                    const content = caseSensitive ? msg.content : msg.content.toLowerCase();
                    return content.includes(searchQuery);
                });
            }
        } else {
            filteredMessages = [];
        }

        return this.formatOutput(filteredMessages, options.format || 'array');
    },

    /**
     * Get messages between two timestamps/IDs
     */
    async getMessagesBetween(afterId, beforeId, context, options = {}) {
        if (!afterId || !beforeId) {
            throw new Error('Both after and before parameters are required');
        }

        const messages = await this.getMessages(context, {
            ...options,
            after: afterId,
            before: beforeId
        });

        return messages;
    },

    /**
     * Get messages around a specific message
     */
    async getMessagesAround(messageId, context, options = {}) {
        if (!messageId) {
            throw new Error('Message ID is required');
        }

        const messages = await this.getMessages(context, {
            ...options,
            around: messageId
        });

        return messages;
    },

    /**
     * Count messages with filters
     */
    async countMessages(context, options = {}) {
        const messages = await this.getMessages(context, { ...options, format: 'array' });
        return Array.isArray(messages) ? messages.length : 0;
    },

    /**
     * Get channel statistics
     */
    async getChannelStats(context, options = {}) {
        try {
            const messages = await this.getMessages(context, { ...options, limit: 100, format: 'array' });
            
            if (!Array.isArray(messages) || messages.length === 0) {
                return {
                    totalMessages: 0,
                    uniqueUsers: 0,
                    averageLength: 0,
                    mostActiveUser: null,
                    timespan: null
                };
            }

            // Calculate statistics
            const userCounts = new Map();
            let totalLength = 0;
            let oldestTimestamp = messages[0].timestamp;
            let newestTimestamp = messages[0].timestamp;

            for (const msg of messages) {
                // User activity
                const userId = msg.author.id;
                userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
                
                // Message length
                totalLength += msg.content.length;
                
                // Timestamps
                if (msg.timestamp < oldestTimestamp) oldestTimestamp = msg.timestamp;
                if (msg.timestamp > newestTimestamp) newestTimestamp = msg.timestamp;
            }

            // Find most active user
            let mostActiveUser = null;
            let maxCount = 0;
            for (const [userId, count] of userCounts.entries()) {
                if (count > maxCount) {
                    maxCount = count;
                    mostActiveUser = {
                        id: userId,
                        messageCount: count,
                        user: messages.find(m => m.author.id === userId)?.author
                    };
                }
            }

            return {
                totalMessages: messages.length,
                uniqueUsers: userCounts.size,
                averageLength: Math.round(totalLength / messages.length),
                mostActiveUser: mostActiveUser,
                timespan: {
                    oldest: oldestTimestamp,
                    newest: newestTimestamp,
                    duration: newestTimestamp - oldestTimestamp
                },
                userActivity: Array.from(userCounts.entries()).map(([userId, count]) => ({
                    userId,
                    messageCount: count,
                    percentage: Math.round((count / messages.length) * 100)
                })).sort((a, b) => b.messageCount - a.messageCount)
            };

        } catch (error) {
            throw new Error(`Failed to get channel stats: ${error.message}`);
        }
    },

    /**
     * Format message object
     */
    formatMessage(message) {
        return {
            id: message.id,
            content: message.content,
            author: {
                id: message.author.id,
                tag: message.author.tag,
                username: message.author.username,
                bot: message.author.bot
            },
            channel: {
                id: message.channel.id,
                name: message.channel.name,
                type: message.channel.type
            },
            timestamp: message.createdTimestamp,
            date: message.createdAt.toISOString(),
            edited: message.editedTimestamp ? {
                timestamp: message.editedTimestamp,
                date: message.editedAt.toISOString()
            } : null,
            attachments: message.attachments.size > 0 ? 
                Array.from(message.attachments.values()).map(att => ({
                    id: att.id,
                    name: att.name,
                    url: att.url,
                    size: att.size
                })) : [],
            embeds: message.embeds.length > 0 ? message.embeds.length : 0,
            reactions: message.reactions.cache.size > 0 ? 
                Array.from(message.reactions.cache.values()).map(reaction => ({
                    emoji: reaction.emoji.name || reaction.emoji.id,
                    count: reaction.count
                })) : [],
            pinned: message.pinned,
            type: message.type
        };
    },

    /**
     * Get channel from context
     */
    async getChannel(context, channelInput) {
        if (channelInput && typeof channelInput === 'object' && channelInput.id) {
            return channelInput;
        }

        const channelId = channelInput.toString().replace(/[<#>]/g, '');
        
        try {
            return await context.client.channels.fetch(channelId);
        } catch {
            return null;
        }
    },

    /**
     * Format output based on requested format
     */
    formatOutput(messages, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(messages);
                
            case 'count':
                return messages.length;
                
            case 'content':
                return messages.map(msg => msg.content);
                
            case 'authors':
                return [...new Set(messages.map(msg => msg.author.tag))];
                
            case 'ids':
                return messages.map(msg => msg.id);
                
            case 'summary':
                return messages.map(msg => ({
                    id: msg.id,
                    author: msg.author.tag,
                    content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
                    timestamp: msg.timestamp
                }));
                
            case 'timeline':
                return messages.map(msg => ({
                    timestamp: msg.timestamp,
                    date: msg.date,
                    author: msg.author.username,
                    content: msg.content
                }));
                
            case 'array':
            default:
                return messages;
        }
    }
};
