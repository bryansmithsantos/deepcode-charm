/**
 * Wait charm - Pause execution with delays
 * Tier 3 primitive for flow control
 * 
 * Examples:
 * $wait[5s] - Wait 5 seconds
 * $wait[{ "duration": "2m", "message": "Please wait..." }] - Wait with message
 * $wait[until, { "condition": "user_ready", "timeout": "30s" }] - Wait for condition
 */
module.exports = {
    name: 'wait',
    description: 'Pause execution with delays and conditions',
    tier: 3,

    async execute(args, context) {
        // Handle simple format: $wait[5s]
        if (typeof args === 'string') {
            const duration = this.parseDuration(args);
            return await this.delay(duration);
        }

        const { 
            action = 'delay',
            duration = '1s',
            message,
            condition,
            timeout = '30s',
            interval = '1s'
        } = args;

        switch (action.toLowerCase()) {
            case 'delay':
            case 'sleep':
                return await this.delay(this.parseDuration(duration), message, context);

            case 'until':
            case 'condition':
                return await this.waitUntil(condition, this.parseDuration(timeout), this.parseDuration(interval), context);

            case 'message':
                return await this.waitForMessage(args, context);

            case 'reaction':
                return await this.waitForReaction(args, context);

            case 'interaction':
                return await this.waitForInteraction(args, context);

            default:
                throw new Error(`Unknown wait action: ${action}`);
        }
    },

    /**
     * Simple delay/sleep
     */
    async delay(milliseconds, message, context) {
        if (milliseconds <= 0) {
            return { waited: 0 };
        }

        // Send waiting message if provided
        let waitMessage;
        if (message && context) {
            try {
                waitMessage = await context.message.channel.send(message);
            } catch {
                // Ignore message send errors
            }
        }

        const startTime = Date.now();
        
        await new Promise(resolve => setTimeout(resolve, milliseconds));
        
        const actualWait = Date.now() - startTime;

        // Delete waiting message if it was sent
        if (waitMessage) {
            try {
                await waitMessage.delete();
            } catch {
                // Ignore delete errors
            }
        }

        return {
            waited: actualWait,
            duration: this.formatDuration(actualWait)
        };
    },

    /**
     * Wait until condition is met
     */
    async waitUntil(condition, timeoutMs, intervalMs, context) {
        if (!condition) {
            throw new Error('Condition is required for wait until');
        }

        const startTime = Date.now();
        const endTime = startTime + timeoutMs;

        while (Date.now() < endTime) {
            // Check condition
            const conditionMet = await this.checkCondition(condition, context);
            
            if (conditionMet) {
                return {
                    success: true,
                    waited: Date.now() - startTime,
                    condition: condition,
                    result: conditionMet
                };
            }

            // Wait for interval before checking again
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        // Timeout reached
        return {
            success: false,
            timeout: true,
            waited: Date.now() - startTime,
            condition: condition
        };
    },

    /**
     * Wait for message from user
     */
    async waitForMessage(options, context) {
        const { 
            user = context.message.author.id,
            channel = context.message.channel.id,
            timeout = '30s',
            filter
        } = options;

        const timeoutMs = this.parseDuration(timeout);
        const targetChannel = await this.getChannel(context, channel);
        
        if (!targetChannel) {
            throw new Error('Channel not found');
        }

        return new Promise((resolve) => {
            const messageFilter = (msg) => {
                // Check user
                if (msg.author.id !== user) return false;
                
                // Check channel
                if (msg.channel.id !== targetChannel.id) return false;
                
                // Apply custom filter if provided
                if (filter && !this.applyMessageFilter(msg, filter)) return false;
                
                return true;
            };

            const collector = targetChannel.createMessageCollector({
                filter: messageFilter,
                max: 1,
                time: timeoutMs
            });

            collector.on('collect', (message) => {
                resolve({
                    success: true,
                    message: {
                        id: message.id,
                        content: message.content,
                        author: message.author.id,
                        timestamp: message.createdAt
                    }
                });
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    resolve({
                        success: false,
                        timeout: true,
                        waited: timeoutMs
                    });
                }
            });
        });
    },

    /**
     * Wait for reaction on message
     */
    async waitForReaction(options, context) {
        const { 
            messageId = context.message.id,
            user = context.message.author.id,
            emoji,
            timeout = '30s'
        } = options;

        const timeoutMs = this.parseDuration(timeout);
        
        // Get the message to watch
        let targetMessage;
        try {
            targetMessage = await context.message.channel.messages.fetch(messageId);
        } catch {
            throw new Error('Message not found');
        }

        return new Promise((resolve) => {
            const reactionFilter = (reaction, reactionUser) => {
                // Check user
                if (reactionUser.id !== user) return false;
                
                // Check emoji if specified
                if (emoji && !this.matchesEmoji(reaction.emoji, emoji)) return false;
                
                return true;
            };

            const collector = targetMessage.createReactionCollector({
                filter: reactionFilter,
                max: 1,
                time: timeoutMs
            });

            collector.on('collect', (reaction, reactionUser) => {
                resolve({
                    success: true,
                    reaction: {
                        emoji: reaction.emoji.name || reaction.emoji.id,
                        user: reactionUser.id,
                        message: targetMessage.id
                    }
                });
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    resolve({
                        success: false,
                        timeout: true,
                        waited: timeoutMs
                    });
                }
            });
        });
    },

    /**
     * Wait for interaction (button click, select menu, etc.)
     */
    async waitForInteraction(options, context) {
        const { 
            user = context.message.author.id,
            customId,
            timeout = '30s',
            type
        } = options;

        const timeoutMs = this.parseDuration(timeout);

        return new Promise((resolve) => {
            const interactionFilter = (interaction) => {
                // Check user
                if (interaction.user.id !== user) return false;
                
                // Check custom ID if specified
                if (customId && interaction.customId !== customId) return false;
                
                // Check interaction type if specified
                if (type && interaction.componentType !== type) return false;
                
                return true;
            };

            const collector = context.message.createMessageComponentCollector({
                filter: interactionFilter,
                max: 1,
                time: timeoutMs
            });

            collector.on('collect', (interaction) => {
                resolve({
                    success: true,
                    interaction: {
                        id: interaction.id,
                        customId: interaction.customId,
                        type: interaction.componentType,
                        user: interaction.user.id,
                        values: interaction.values || null
                    }
                });
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    resolve({
                        success: false,
                        timeout: true,
                        waited: timeoutMs
                    });
                }
            });
        });
    },

    /**
     * Parse duration string to milliseconds
     */
    parseDuration(duration) {
        if (typeof duration === 'number') {
            return duration;
        }

        const match = duration.toString().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i);
        if (!match) {
            throw new Error(`Invalid duration format: ${duration}`);
        }

        const [, amount, unit] = match;
        const num = parseFloat(amount);

        switch ((unit || 's').toLowerCase()) {
            case 'ms': return num;
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: return num * 1000; // Default to seconds
        }
    },

    /**
     * Format duration from milliseconds to readable string
     */
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    },

    /**
     * Check condition (placeholder for condition evaluation)
     */
    async checkCondition(condition, context) {
        // This is a simplified condition checker
        // In a real implementation, this would evaluate complex conditions
        
        if (typeof condition === 'string') {
            // Check if it's a variable condition
            if (condition.startsWith('$')) {
                // Variable-based condition (simplified)
                return context.client.variables?.get(condition.slice(1)) || false;
            }
            
            // Simple string conditions
            return condition === 'true';
        }

        if (typeof condition === 'boolean') {
            return condition;
        }

        if (typeof condition === 'function') {
            return await condition(context);
        }

        return false;
    },

    /**
     * Apply message filter
     */
    applyMessageFilter(message, filter) {
        if (typeof filter === 'string') {
            return message.content.includes(filter);
        }

        if (typeof filter === 'object') {
            if (filter.content && !message.content.includes(filter.content)) return false;
            if (filter.startsWith && !message.content.startsWith(filter.startsWith)) return false;
            if (filter.endsWith && !message.content.endsWith(filter.endsWith)) return false;
            if (filter.regex && !new RegExp(filter.regex).test(message.content)) return false;
        }

        return true;
    },

    /**
     * Check if emoji matches
     */
    matchesEmoji(reactionEmoji, targetEmoji) {
        if (typeof targetEmoji === 'string') {
            return reactionEmoji.name === targetEmoji || reactionEmoji.id === targetEmoji;
        }

        if (typeof targetEmoji === 'object') {
            if (targetEmoji.id) return reactionEmoji.id === targetEmoji.id;
            if (targetEmoji.name) return reactionEmoji.name === targetEmoji.name;
        }

        return false;
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
    }
};
