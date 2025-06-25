/**
 * Permission charm - Advanced permission operations
 */
module.exports = {
    name: 'permission',
    description: 'Permission management and checking',

    async execute(args, context) {
        const { action = 'check', options = {} } = args;

        if (!context.guild) {
            throw new Error('Must be used in a guild');
        }

        switch (action.toLowerCase()) {
            case 'check': {
                const { permissions, member: targetId, channel: channelId } = options;

                const member = targetId ? 
                    await context.guild.members.fetch(targetId) :
                    context.member;
                    
                const channel = channelId ?
                    await context.guild.channels.fetch(channelId) :
                    context.channel;

                if (Array.isArray(permissions)) {
                    return permissions.every(perm => 
                        this.hasPermission(member, perm, channel));
                }
                
                return this.hasPermission(member, permissions, channel);
            }

            case 'grant': {
                const { permissions, roles = [], channels = [] } = options;
                
                const targetRoles = await Promise.all(
                    roles.map(id => context.guild.roles.fetch(id))
                );

                const targetChannels = channels.length > 0 ?
                    await Promise.all(channels.map(id => context.guild.channels.fetch(id))) :
                    [context.channel];

                for (const role of targetRoles) {
                    for (const channel of targetChannels) {
                        await channel.permissionOverwrites.edit(role, {
                            [permissions]: true
                        });
                    }
                }

                return true;
            }

            case 'deny': {
                const { permissions, roles = [], channels = [] } = options;
                
                const targetRoles = await Promise.all(
                    roles.map(id => context.guild.roles.fetch(id))
                );

                const targetChannels = channels.length > 0 ?
                    await Promise.all(channels.map(id => context.guild.channels.fetch(id))) :
                    [context.channel];

                for (const role of targetRoles) {
                    for (const channel of targetChannels) {
                        await channel.permissionOverwrites.edit(role, {
                            [permissions]: false
                        });
                    }
                }

                return true;
            }

            case 'neutral': {
                const { permissions, roles = [], channels = [] } = options;
                
                const targetRoles = await Promise.all(
                    roles.map(id => context.guild.roles.fetch(id))
                );

                const targetChannels = channels.length > 0 ?
                    await Promise.all(channels.map(id => context.guild.channels.fetch(id))) :
                    [context.channel];

                for (const role of targetRoles) {
                    for (const channel of targetChannels) {
                        await channel.permissionOverwrites.edit(role, {
                            [permissions]: null
                        });
                    }
                }

                return true;
            }

            case 'list': {
                const { target, channel: channelId } = options;

                const member = await context.guild.members.fetch(target);
                const channel = channelId ?
                    await context.guild.channels.fetch(channelId) :
                    context.channel;

                return {
                    guild: member.permissions.toArray(),
                    channel: member.permissionsIn(channel).toArray()
                };
            }

            case 'compare': {
                const { members = [], permissions } = options;

                const results = await Promise.all(
                    members.map(async id => {
                        const member = await context.guild.members.fetch(id);
                        const hasPerms = Array.isArray(permissions) ?
                            permissions.every(p => this.hasPermission(member, p)) :
                            this.hasPermission(member, permissions);

                        return {
                            id: member.id,
                            tag: member.user.tag,
                            hasPermission: hasPerms
                        };
                    })
                );

                return results;
            }

            default:
                throw new Error('Invalid permission action');
        }
    },

    /**
     * Check if member has permission
     */
    hasPermission(member, permission, channel) {
        if (channel) {
            return member.permissionsIn(channel).has(permission);
        }
        return member.permissions.has(permission);
    },

    /**
     * Resolve permission flag
     */
    resolvePermission(permission) {
        const Permissions = {
            CREATE_INSTANT_INVITE: 1n << 0n,
            KICK_MEMBERS: 1n << 1n,
            BAN_MEMBERS: 1n << 2n,
            ADMINISTRATOR: 1n << 3n,
            MANAGE_CHANNELS: 1n << 4n,
            MANAGE_GUILD: 1n << 5n,
            ADD_REACTIONS: 1n << 6n,
            VIEW_AUDIT_LOG: 1n << 7n,
            PRIORITY_SPEAKER: 1n << 8n,
            STREAM: 1n << 9n,
            VIEW_CHANNEL: 1n << 10n,
            SEND_MESSAGES: 1n << 11n,
            SEND_TTS_MESSAGES: 1n << 12n,
            MANAGE_MESSAGES: 1n << 13n,
            EMBED_LINKS: 1n << 14n,
            ATTACH_FILES: 1n << 15n,
            READ_MESSAGE_HISTORY: 1n << 16n,
            MENTION_EVERYONE: 1n << 17n,
            USE_EXTERNAL_EMOJIS: 1n << 18n,
            VIEW_GUILD_INSIGHTS: 1n << 19n,
            CONNECT: 1n << 20n,
            SPEAK: 1n << 21n,
            MUTE_MEMBERS: 1n << 22n,
            DEAFEN_MEMBERS: 1n << 23n,
            MOVE_MEMBERS: 1n << 24n,
            USE_VAD: 1n << 25n,
            CHANGE_NICKNAME: 1n << 26n,
            MANAGE_NICKNAMES: 1n << 27n,
            MANAGE_ROLES: 1n << 28n,
            MANAGE_WEBHOOKS: 1n << 29n,
            MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
            USE_APPLICATION_COMMANDS: 1n << 31n,
            REQUEST_TO_SPEAK: 1n << 32n,
            MANAGE_EVENTS: 1n << 33n,
            MANAGE_THREADS: 1n << 34n,
            CREATE_PUBLIC_THREADS: 1n << 35n,
            CREATE_PRIVATE_THREADS: 1n << 36n,
            USE_EXTERNAL_STICKERS: 1n << 37n,
            SEND_MESSAGES_IN_THREADS: 1n << 38n,
            USE_EMBEDDED_ACTIVITIES: 1n << 39n,
            MODERATE_MEMBERS: 1n << 40n
        };

        return Permissions[permission.toUpperCase()] || 0n;
    }
};
