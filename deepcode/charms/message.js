/**
 * Message charm - Advanced message operations
 */
module.exports = {
    name: 'message',
    description: 'Message manipulation and control',

    async execute(args, context) {
        const { action = 'send', options = {}, target, content } = args;

        switch (action.toLowerCase()) {
            case 'send': {
                const channel = target ? 
                    await context.client.channels.fetch(target) :
                    context.channel;
                    
                const msg = await channel.send({
                    content,
                    ...options
                });
                return this.getMessageData(msg);
            }

            case 'edit': {
                const msg = target ?
                    await context.channel.messages.fetch(target) :
                    context.message;
                    
                const edited = await msg.edit({
                    content,
                    ...options
                });
                return this.getMessageData(edited);
            }

            case 'delete': {
                const messages = Array.isArray(target) ? target : [target];
                const channel = context.channel;

                if (messages.length === 1) {
                    const msg = await channel.messages.fetch(messages[0]);
                    await msg.delete();
                } else {
                    await channel.bulkDelete(messages);
                }
                return true;
            }

            case 'pin': {
                const msg = await context.channel.messages.fetch(target);
                await msg.pin();
                return true;
            }

            case 'unpin': {
                const msg = await context.channel.messages.fetch(target);
                await msg.unpin();
                return true;
            }

            case 'react': {
                const msg = target ?
                    await context.channel.messages.fetch(target) :
                    context.message;
                    
                const emoji = content;
                await msg.react(emoji);
                return true;
            }

            case 'fetch': {
                if (!target) throw new Error('Message ID required');
                const msg = await context.channel.messages.fetch(target);
                return this.getMessageData(msg);
            }

            case 'history': {
                const { limit = 100, before, after, around } = options;
                const messages = await context.channel.messages.fetch({
                    limit,
                    before,
                    after,
                    around
                });
                return [...messages.values()].map(m => this.getMessageData(m));
            }

            case 'search': {
                const { query, limit = 25, includePinned = false } = options;
                const messages = await context.channel.messages.fetch({ limit: 100 });
                
                return [...messages.values()]
                    .filter(m => {
                        if (!includePinned && m.pinned) return false;
                        return m.content.toLowerCase().includes(query.toLowerCase());
                    })
                    .slice(0, limit)
                    .map(m => this.getMessageData(m));
            }

            case 'crosspost': {
                const msg = await context.channel.messages.fetch(target);
                const crossposted = await msg.crosspost();
                return this.getMessageData(crossposted);
            }

            default:
                throw new Error('Invalid message action');
        }
    },

    /**
     * Get clean message data object
     */
    getMessageData(message) {
        return {
            id: message.id,
            content: message.content,
            authorId: message.author.id,
            authorTag: message.author.tag,
            channelId: message.channel.id,
            guildId: message.guild?.id,
            createdAt: message.createdAt,
            editedAt: message.editedAt,
            pinned: message.pinned,
            tts: message.tts,
            type: message.type,
            embeds: message.embeds,
            components: message.components,
            attachments: [...message.attachments.values()],
            reactions: [...message.reactions.cache.values()].map(r => ({
                emoji: r.emoji.toString(),
                count: r.count,
                me: r.me
            }))
        };
    }
};
