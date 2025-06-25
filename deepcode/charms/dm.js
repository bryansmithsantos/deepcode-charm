/**
 * DM charm - Send direct messages to users
 * Tier 1 primitive for private communication
 */
module.exports = {
    name: 'dm',
    description: 'Send direct messages to users',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $dm[$$mention, Hello!]
        if (typeof args === 'string' && args.includes(',')) {
            const [userInput, content] = args.split(',').map(s => s.trim());
            return await this.sendDM(userInput, { content }, context);
        }

        const {
            user,
            target,
            content,
            embed,
            embeds,
            files,
            components
        } = args;

        const userInput = user || target;
        if (!userInput) {
            throw new Error('User target is required for DM');
        }

        // Build message options
        const messageOptions = {};

        // Content
        if (content) {
            messageOptions.content = content.toString();
        }

        // Embeds
        if (embed) {
            messageOptions.embeds = [this.processEmbed(embed)];
        } else if (embeds && Array.isArray(embeds)) {
            messageOptions.embeds = embeds.map(e => this.processEmbed(e));
        }

        // Files
        if (files) {
            messageOptions.files = Array.isArray(files) ? files : [files];
        }

        // Components
        if (components) {
            messageOptions.components = Array.isArray(components) ? components : [components];
        }

        // Validate that we have content to send
        if (!messageOptions.content && !messageOptions.embeds && !messageOptions.files) {
            throw new Error('DM must have content, embed, or file');
        }

        return await this.sendDM(userInput, messageOptions, context);
    },

    /**
     * Send DM to user
     */
    async sendDM(userInput, messageOptions, context) {
        try {
            // Get user object
            const user = await this.getUser(userInput, context);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is a bot (optional protection)
            if (user.bot) {
                throw new Error('Cannot send DM to bot users');
            }

            // Create DM channel and send message
            const dmChannel = await user.createDM();
            const sentMessage = await dmChannel.send(messageOptions);

            return {
                success: true,
                user: {
                    id: user.id,
                    tag: user.tag,
                    username: user.username
                },
                message: {
                    id: sentMessage.id,
                    content: sentMessage.content,
                    timestamp: sentMessage.createdAt
                },
                channel: dmChannel.id
            };

        } catch (error) {
            // Handle common DM errors
            if (error.code === 50007) {
                throw new Error('Cannot send DM to this user (they may have DMs disabled)');
            } else if (error.code === 50013) {
                throw new Error('Missing permissions to send DM');
            } else {
                throw new Error(`Failed to send DM: ${error.message}`);
            }
        }
    },

    /**
     * Get user from input
     */
    async getUser(userInput, context) {
        try {
            // Extract user ID from mention or use directly
            const userId = userInput.toString().replace(/[<@!>]/g, '');
            
            // Try to get user from guild first, then fetch from Discord
            try {
                const member = await context.message.guild.members.fetch(userId);
                return member.user;
            } catch {
                return await context.client.users.fetch(userId);
            }
        } catch {
            return null;
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
    }
};
