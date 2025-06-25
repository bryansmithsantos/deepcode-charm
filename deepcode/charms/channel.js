/**
 * Channel charm - Channel manipulation and queries
 */
module.exports = {
    name: 'channel',
    description: 'Channel operations and management',

    async execute(args, context) {
        const { action = 'get', id, options = {} } = args;

        switch (action.toLowerCase()) {
            case 'get': {
                const channel = id ? 
                    await context.client.channels.fetch(id) :
                    context.channel;
                return this.getChannelData(channel);
            }

            case 'create': {
                const { name, type = 'GUILD_TEXT', parent, topic, nsfw = false } = options;
                if (!context.guild) throw new Error('Must be in a guild');
                
                const channel = await context.guild.channels.create({
                    name,
                    type,
                    parent: parent ? await context.guild.channels.fetch(parent) : null,
                    topic,
                    nsfw
                });
                return this.getChannelData(channel);
            }

            case 'edit': {
                const channel = id ? 
                    await context.client.channels.fetch(id) :
                    context.channel;
                    
                await channel.edit(options);
                return this.getChannelData(channel);
            }

            case 'delete': {
                const channel = await context.client.channels.fetch(id);
                await channel.delete();
                return true;
            }

            case 'list': {
                const { type, category } = options;
                if (!context.guild) throw new Error('Must be in a guild');

                let channels = [...context.guild.channels.cache.values()];
                
                if (type) {
                    channels = channels.filter(c => c.type === type);
                }
                
                if (category) {
                    const parent = await context.guild.channels.fetch(category);
                    channels = channels.filter(c => c.parentId === parent.id);
                }

                return channels.map(c => this.getChannelData(c));
            }

            case 'clone': {
                const channel = id ? 
                    await context.client.channels.fetch(id) :
                    context.channel;
                    
                const cloned = await channel.clone(options);
                return this.getChannelData(cloned);
            }

            case 'sync': {
                const channel = id ? 
                    await context.client.channels.fetch(id) :
                    context.channel;
                    
                await channel.lockPermissions();
                return true;
            }

            case 'setPerms': {
                const { target, allow = [], deny = [] } = options;
                const channel = id ? 
                    await context.client.channels.fetch(id) :
                    context.channel;

                await channel.permissionOverwrites.edit(target, {
                    allow,
                    deny
                });
                return true;
            }

            default:
                throw new Error('Invalid channel action');
        }
    },

    /**
     * Get clean channel data object
     */
    getChannelData(channel) {
        return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            position: channel.position,
            parentId: channel.parentId,
            topic: channel.topic,
            nsfw: channel.nsfw,
            createdAt: channel.createdAt,
            lastMessageId: channel.lastMessageId,
            rateLimitPerUser: channel.rateLimitPerUser,
            permissionOverwrites: [...channel.permissionOverwrites.cache.values()].map(p => ({
                id: p.id,
                type: p.type,
                allow: p.allow.toArray(),
                deny: p.deny.toArray()
            }))
        };
    }
};
