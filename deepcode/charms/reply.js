/**
 * Reply charm - Reply to messages with various options
 * Tier 1 primitive for message responses
 */
module.exports = {
    name: 'reply',
    description: 'Reply to messages with various options',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $reply[Hello!]
        if (typeof args === 'string') {
            return await this.sendReply(context, { content: args });
        }

        const {
            content,
            embed,
            embeds,
            files,
            components,
            ephemeral = false,
            mention = true,
            messageId,
            allowedMentions
        } = args;

        // Build reply options
        const replyOptions = {};

        // Content
        if (content) {
            replyOptions.content = content.toString();
        }

        // Embeds
        if (embed) {
            replyOptions.embeds = [this.processEmbed(embed)];
        } else if (embeds && Array.isArray(embeds)) {
            replyOptions.embeds = embeds.map(e => this.processEmbed(e));
        }

        // Files
        if (files) {
            replyOptions.files = Array.isArray(files) ? files : [files];
        }

        // Components
        if (components) {
            replyOptions.components = Array.isArray(components) ? components : [components];
        }

        // Ephemeral (for interactions)
        if (ephemeral && context.interaction) {
            replyOptions.ephemeral = true;
        }

        // Mention settings
        if (!mention) {
            replyOptions.allowedMentions = { repliedUser: false };
        } else if (allowedMentions) {
            replyOptions.allowedMentions = allowedMentions;
        }

        // Message to reply to
        if (messageId) {
            const targetMessage = await this.getMessage(context, messageId);
            if (targetMessage) {
                replyOptions.reply = { messageReference: targetMessage.id };
            }
        }

        return await this.sendReply(context, replyOptions);
    },

    /**
     * Send reply message
     */
    async sendReply(context, options) {
        try {
            // Handle interaction replies
            if (context.interaction) {
                if (context.interaction.replied || context.interaction.deferred) {
                    return await context.interaction.editReply(options);
                } else {
                    return await context.interaction.reply(options);
                }
            }

            // Handle message replies
            if (context.message) {
                // If no specific message to reply to, reply to the current message
                if (!options.reply) {
                    return await context.message.reply(options);
                } else {
                    // Reply to specific message
                    return await context.message.channel.send(options);
                }
            }

            throw new Error('No valid context for reply');

        } catch (error) {
            throw new Error(`Failed to send reply: ${error.message}`);
        }
    },

    /**
     * Process embed object
     */
    processEmbed(embed) {
        if (typeof embed === 'string') {
            try {
                return JSON.parse(embed);
            } catch {
                return { description: embed };
            }
        }

        if (typeof embed === 'object' && embed !== null) {
            return embed;
        }

        return { description: 'Invalid embed' };
    },

    /**
     * Get message by ID
     */
    async getMessage(context, messageId) {
        try {
            // Try current channel first
            try {
                return await context.message.channel.messages.fetch(messageId);
            } catch {
                // Try other channels in guild
                if (context.message.guild) {
                    for (const channel of context.message.guild.channels.cache.values()) {
                        if (channel.isTextBased()) {
                            try {
                                return await channel.messages.fetch(messageId);
                            } catch {
                                continue;
                            }
                        }
                    }
                }
                return null;
            }
        } catch {
            return null;
        }
    }
};
