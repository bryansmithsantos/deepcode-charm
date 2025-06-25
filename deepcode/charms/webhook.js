/**
 * Webhook charm - Manage webhooks
 * Tier 2 primitive for webhook operations
 * 
 * Examples:
 * $webhook[create, { "name": "Bot", "channel": "123456789" }] - Create webhook
 * $webhook[send, { "url": "webhook_url", "content": "Hello!" }] - Send message
 * $webhook[list, { "channel": "123456789" }] - List webhooks
 */
module.exports = {
    name: 'webhook',
    description: 'Manage webhooks for channels',
    tier: 2,

    async execute(args, context) {
        const { 
            action = 'send', 
            name, 
            url, 
            channel, 
            content, 
            username, 
            avatar, 
            embeds,
            reason = 'Webhook managed via bot'
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
                return await this.createWebhook(name, channel, context, reason, avatar);

            case 'delete':
            case 'remove':
                return await this.deleteWebhook(url || name, context, reason);

            case 'send':
                return await this.sendWebhook(url, { content, username, avatar, embeds }, context);

            case 'list':
                return await this.listWebhooks(channel, context);

            case 'get':
            case 'info':
                return await this.getWebhook(url || name, context);

            case 'edit':
                return await this.editWebhook(url || name, args, context, reason);

            default:
                throw new Error(`Unknown webhook action: ${action}`);
        }
    },

    /**
     * Create webhook
     */
    async createWebhook(name, channelId, context, reason, avatar) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_WEBHOOKS')) {
                throw new Error('You do not have permission to manage webhooks');
            }

            if (!name) {
                throw new Error('Webhook name is required');
            }

            // Get target channel
            const targetChannel = await this.getChannel(context, channelId || context.message.channel.id);
            if (!targetChannel) {
                throw new Error('Channel not found');
            }

            if (!targetChannel.isTextBased()) {
                throw new Error('Webhooks can only be created in text channels');
            }

            const webhook = await targetChannel.createWebhook({
                name: name,
                avatar: avatar || null,
                reason: reason
            });

            return {
                success: true,
                webhook: {
                    id: webhook.id,
                    name: webhook.name,
                    url: webhook.url,
                    token: webhook.token,
                    avatar: webhook.avatarURL(),
                    channel: {
                        id: webhook.channelId,
                        name: targetChannel.name
                    },
                    guild: {
                        id: webhook.guildId,
                        name: context.message.guild.name
                    },
                    createdAt: webhook.createdAt
                }
            };

        } catch (error) {
            throw new Error(`Failed to create webhook: ${error.message}`);
        }
    },

    /**
     * Delete webhook
     */
    async deleteWebhook(identifier, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_WEBHOOKS')) {
                throw new Error('You do not have permission to manage webhooks');
            }

            let webhook;

            // If it's a URL, extract webhook from URL
            if (identifier.includes('discord.com/api/webhooks/')) {
                const webhookId = identifier.split('/')[5];
                const webhookToken = identifier.split('/')[6];
                webhook = await context.client.fetchWebhook(webhookId, webhookToken);
            } else {
                // Find webhook by name or ID in guild
                const guild = context.message.guild;
                const webhooks = await guild.fetchWebhooks();
                webhook = webhooks.find(w => w.name === identifier || w.id === identifier);
            }

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            await webhook.delete(reason);

            return {
                success: true,
                deletedWebhook: {
                    id: webhook.id,
                    name: webhook.name,
                    channel: webhook.channelId
                }
            };

        } catch (error) {
            throw new Error(`Failed to delete webhook: ${error.message}`);
        }
    },

    /**
     * Send message via webhook
     */
    async sendWebhook(webhookUrl, options, context) {
        try {
            if (!webhookUrl) {
                throw new Error('Webhook URL is required');
            }

            // Extract webhook ID and token from URL
            const urlParts = webhookUrl.split('/');
            const webhookId = urlParts[5];
            const webhookToken = urlParts[6];

            if (!webhookId || !webhookToken) {
                throw new Error('Invalid webhook URL format');
            }

            const webhook = await context.client.fetchWebhook(webhookId, webhookToken);

            // Build message options
            const messageOptions = {};

            if (options.content) {
                messageOptions.content = options.content.toString();
            }

            if (options.username) {
                messageOptions.username = options.username.toString();
            }

            if (options.avatar) {
                messageOptions.avatarURL = options.avatar.toString();
            }

            if (options.embeds) {
                messageOptions.embeds = Array.isArray(options.embeds) ? 
                    options.embeds.map(e => this.processEmbed(e)) : 
                    [this.processEmbed(options.embeds)];
            }

            // Validate that we have content to send
            if (!messageOptions.content && !messageOptions.embeds) {
                throw new Error('Webhook message must have content or embeds');
            }

            const sentMessage = await webhook.send(messageOptions);

            return {
                success: true,
                message: {
                    id: sentMessage.id,
                    content: sentMessage.content,
                    timestamp: sentMessage.createdAt,
                    webhook: {
                        id: webhook.id,
                        name: webhook.name
                    }
                }
            };

        } catch (error) {
            throw new Error(`Failed to send webhook message: ${error.message}`);
        }
    },

    /**
     * List webhooks in channel or guild
     */
    async listWebhooks(channelId, context) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_WEBHOOKS')) {
                throw new Error('You do not have permission to view webhooks');
            }

            let webhooks;

            if (channelId) {
                // List webhooks for specific channel
                const channel = await this.getChannel(context, channelId);
                if (!channel) {
                    throw new Error('Channel not found');
                }
                webhooks = await channel.fetchWebhooks();
            } else {
                // List all webhooks in guild
                const guild = context.message.guild;
                webhooks = await guild.fetchWebhooks();
            }

            const webhookList = Array.from(webhooks.values()).map(webhook => ({
                id: webhook.id,
                name: webhook.name,
                url: webhook.url,
                avatar: webhook.avatarURL(),
                channel: {
                    id: webhook.channelId,
                    name: webhook.channel?.name || 'Unknown'
                },
                owner: webhook.owner ? {
                    id: webhook.owner.id,
                    tag: webhook.owner.tag
                } : null,
                createdAt: webhook.createdAt
            }));

            return webhookList;

        } catch (error) {
            throw new Error(`Failed to list webhooks: ${error.message}`);
        }
    },

    /**
     * Get webhook info
     */
    async getWebhook(identifier, context) {
        try {
            let webhook;

            // If it's a URL, extract webhook from URL
            if (identifier.includes('discord.com/api/webhooks/')) {
                const webhookId = identifier.split('/')[5];
                const webhookToken = identifier.split('/')[6];
                webhook = await context.client.fetchWebhook(webhookId, webhookToken);
            } else {
                // Find webhook by name or ID in guild
                const guild = context.message.guild;
                const webhooks = await guild.fetchWebhooks();
                webhook = webhooks.find(w => w.name === identifier || w.id === identifier);
            }

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            return {
                id: webhook.id,
                name: webhook.name,
                url: webhook.url,
                avatar: webhook.avatarURL(),
                channel: {
                    id: webhook.channelId,
                    name: webhook.channel?.name || 'Unknown'
                },
                guild: {
                    id: webhook.guildId,
                    name: webhook.guild?.name || 'Unknown'
                },
                owner: webhook.owner ? {
                    id: webhook.owner.id,
                    tag: webhook.owner.tag
                } : null,
                createdAt: webhook.createdAt
            };

        } catch (error) {
            throw new Error(`Failed to get webhook: ${error.message}`);
        }
    },

    /**
     * Edit webhook
     */
    async editWebhook(identifier, options, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_WEBHOOKS')) {
                throw new Error('You do not have permission to manage webhooks');
            }

            const { newName, newAvatar, newChannel } = options;

            let webhook;

            // Find webhook
            if (identifier.includes('discord.com/api/webhooks/')) {
                const webhookId = identifier.split('/')[5];
                const webhookToken = identifier.split('/')[6];
                webhook = await context.client.fetchWebhook(webhookId, webhookToken);
            } else {
                const guild = context.message.guild;
                const webhooks = await guild.fetchWebhooks();
                webhook = webhooks.find(w => w.name === identifier || w.id === identifier);
            }

            if (!webhook) {
                throw new Error('Webhook not found');
            }

            // Build edit options
            const editOptions = {};
            if (newName) editOptions.name = newName;
            if (newAvatar) editOptions.avatar = newAvatar;
            if (newChannel) {
                const channel = await this.getChannel(context, newChannel);
                if (channel) editOptions.channel = channel;
            }

            const editedWebhook = await webhook.edit(editOptions, reason);

            return {
                success: true,
                webhook: {
                    id: editedWebhook.id,
                    name: editedWebhook.name,
                    url: editedWebhook.url,
                    avatar: editedWebhook.avatarURL(),
                    channel: {
                        id: editedWebhook.channelId,
                        name: editedWebhook.channel?.name || 'Unknown'
                    }
                }
            };

        } catch (error) {
            throw new Error(`Failed to edit webhook: ${error.message}`);
        }
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
