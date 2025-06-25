/**
 * Invite charm - Manage server invites
 * Tier 2 primitive for invite operations
 */
module.exports = {
    name: 'invite',
    description: 'Manage server invites',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $invite[create]
        if (typeof args === 'string') {
            return await this.handleAction(args, {}, context);
        }

        const { action = 'create', ...options } = args;
        return await this.handleAction(action, options, context);
    },

    /**
     * Handle invite actions
     */
    async handleAction(action, options, context) {
        switch (action.toLowerCase()) {
            case 'create':
                return await this.createInvite(options, context);

            case 'list':
                return await this.listInvites(options, context);

            case 'get':
                return await this.getInvite(options, context);

            case 'delete':
            case 'revoke':
                return await this.deleteInvite(options, context);

            case 'info':
                return await this.getInviteInfo(options, context);

            default:
                throw new Error(`Unknown invite action: ${action}`);
        }
    },

    /**
     * Create server invite
     */
    async createInvite(options, context) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('CREATE_INSTANT_INVITE')) {
                throw new Error('You do not have permission to create invites');
            }

            const {
                channel = context.message.channel.id,
                maxAge = 86400, // 24 hours default
                maxUses = 0, // unlimited
                temporary = false,
                unique = false,
                reason = 'Invite created via bot'
            } = options;

            // Get target channel
            const targetChannel = await this.getChannel(context, channel);
            if (!targetChannel) {
                throw new Error('Channel not found');
            }

            // Create invite
            const invite = await targetChannel.createInvite({
                maxAge: this.validateMaxAge(maxAge),
                maxUses: this.validateMaxUses(maxUses),
                temporary,
                unique,
                reason
            });

            return {
                success: true,
                invite: {
                    code: invite.code,
                    url: invite.url,
                    channel: {
                        id: invite.channel.id,
                        name: invite.channel.name,
                        type: invite.channel.type
                    },
                    guild: {
                        id: invite.guild.id,
                        name: invite.guild.name
                    },
                    inviter: {
                        id: invite.inviter.id,
                        tag: invite.inviter.tag
                    },
                    maxAge: invite.maxAge,
                    maxUses: invite.maxUses,
                    temporary: invite.temporary,
                    createdAt: invite.createdAt,
                    expiresAt: invite.expiresAt
                }
            };

        } catch (error) {
            throw new Error(`Failed to create invite: ${error.message}`);
        }
    },

    /**
     * List server invites
     */
    async listInvites(options, context) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_GUILD')) {
                throw new Error('You do not have permission to view invites');
            }

            const { format = 'array', includeExpired = false } = options;
            const guild = context.message.guild;

            const invites = await guild.invites.fetch();
            let inviteList = Array.from(invites.values());

            // Filter expired invites if requested
            if (!includeExpired) {
                inviteList = inviteList.filter(invite => 
                    !invite.expiresAt || invite.expiresAt > new Date()
                );
            }

            // Format results
            const formattedInvites = inviteList.map(invite => ({
                code: invite.code,
                url: invite.url,
                channel: invite.channel.name,
                inviter: invite.inviter?.tag || 'Unknown',
                uses: invite.uses,
                maxUses: invite.maxUses,
                maxAge: invite.maxAge,
                temporary: invite.temporary,
                createdAt: invite.createdAt,
                expiresAt: invite.expiresAt
            }));

            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(formattedInvites);
                case 'count':
                    return formattedInvites.length;
                case 'codes':
                    return formattedInvites.map(inv => inv.code);
                case 'urls':
                    return formattedInvites.map(inv => inv.url);
                case 'array':
                default:
                    return formattedInvites;
            }

        } catch (error) {
            throw new Error(`Failed to list invites: ${error.message}`);
        }
    },

    /**
     * Get specific invite information
     */
    async getInvite(options, context) {
        try {
            const { code, withCounts = false } = options;
            
            if (!code) {
                throw new Error('Invite code is required');
            }

            const invite = await context.client.fetchInvite(code, { withCounts });

            return {
                code: invite.code,
                url: invite.url,
                guild: {
                    id: invite.guild?.id,
                    name: invite.guild?.name,
                    description: invite.guild?.description,
                    icon: invite.guild?.iconURL(),
                    banner: invite.guild?.bannerURL(),
                    memberCount: invite.memberCount,
                    presenceCount: invite.presenceCount
                },
                channel: {
                    id: invite.channel?.id,
                    name: invite.channel?.name,
                    type: invite.channel?.type
                },
                inviter: invite.inviter ? {
                    id: invite.inviter.id,
                    tag: invite.inviter.tag,
                    avatar: invite.inviter.displayAvatarURL()
                } : null,
                uses: invite.uses,
                maxUses: invite.maxUses,
                maxAge: invite.maxAge,
                temporary: invite.temporary,
                createdAt: invite.createdAt,
                expiresAt: invite.expiresAt
            };

        } catch (error) {
            throw new Error(`Failed to get invite: ${error.message}`);
        }
    },

    /**
     * Delete/revoke invite
     */
    async deleteInvite(options, context) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_GUILD')) {
                throw new Error('You do not have permission to delete invites');
            }

            const { code, reason = 'Invite deleted via bot' } = options;
            
            if (!code) {
                throw new Error('Invite code is required');
            }

            const guild = context.message.guild;
            const invites = await guild.invites.fetch();
            const invite = invites.get(code);

            if (!invite) {
                throw new Error('Invite not found in this server');
            }

            await invite.delete(reason);

            return {
                success: true,
                deletedInvite: {
                    code: invite.code,
                    channel: invite.channel.name,
                    inviter: invite.inviter?.tag || 'Unknown'
                }
            };

        } catch (error) {
            throw new Error(`Failed to delete invite: ${error.message}`);
        }
    },

    /**
     * Get invite info (alias for get)
     */
    async getInviteInfo(options, context) {
        return await this.getInvite(options, context);
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
     * Validate maxAge parameter
     */
    validateMaxAge(maxAge) {
        const age = parseInt(maxAge);
        if (isNaN(age) || age < 0) return 86400; // Default 24 hours
        if (age > 604800) return 604800; // Max 7 days
        return age;
    },

    /**
     * Validate maxUses parameter
     */
    validateMaxUses(maxUses) {
        const uses = parseInt(maxUses);
        if (isNaN(uses) || uses < 0) return 0; // Unlimited
        if (uses > 100) return 100; // Max 100 uses
        return uses;
    }
};
