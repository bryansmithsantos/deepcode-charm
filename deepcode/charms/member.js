/**
 * Member charm - Advanced member operations
 */
module.exports = {
    name: 'member',
    description: 'Member management and information',

    async execute(args, context) {
        const { action = 'get', target, options = {} } = args;

        if (!context.guild) {
            throw new Error('Must be used in a guild');
        }

        switch (action.toLowerCase()) {
            case 'get': {
                const member = await context.guild.members.fetch(target);
                return this.getMemberData(member);
            }

            case 'find': {
                const { query } = options;
                const members = await context.guild.members.fetch();
                
                return members
                    .filter(m => 
                        m.user.username.toLowerCase().includes(query.toLowerCase()) ||
                        m.displayName.toLowerCase().includes(query.toLowerCase()) ||
                        m.user.tag.toLowerCase().includes(query.toLowerCase())
                    )
                    .map(m => this.getMemberData(m));
            }

            case 'nickname': {
                const member = await context.guild.members.fetch(target);
                const { nickname, reason } = options;
                await member.setNickname(nickname, reason);
                return this.getMemberData(member);
            }

            case 'timeout': {
                const member = await context.guild.members.fetch(target);
                const { duration, reason } = options;
                await member.timeout(duration, reason);
                return this.getMemberData(member);
            }

            case 'voice': {
                const member = await context.guild.members.fetch(target);
                const { mute, deaf, reason } = options;
                
                if (typeof mute === 'boolean') {
                    await member.voice.setMute(mute, reason);
                }
                if (typeof deaf === 'boolean') {
                    await member.voice.setDeaf(deaf, reason);
                }
                
                return this.getMemberData(member);
            }

            case 'move': {
                const member = await context.guild.members.fetch(target);
                const { channel, reason } = options;
                await member.voice.setChannel(channel, reason);
                return this.getMemberData(member);
            }

            case 'permissions': {
                const member = await context.guild.members.fetch(target);
                const { channel } = options;
                
                if (channel) {
                    const targetChannel = await context.guild.channels.fetch(channel);
                    return member.permissionsIn(targetChannel).toArray();
                }
                
                return member.permissions.toArray();
            }

            case 'ban': {
                const { reason, days = 0 } = options;
                await context.guild.members.ban(target, { 
                    reason,
                    deleteMessageDays: days
                });
                return true;
            }

            case 'kick': {
                const member = await context.guild.members.fetch(target);
                const { reason } = options;
                await member.kick(reason);
                return true;
            }

            case 'list': {
                const { filter, limit = 1000, presence = false } = options;
                const members = await context.guild.members.fetch({ limit });
                
                let filtered = members;
                if (filter) {
                    filtered = members.filter(m => {
                        switch (filter) {
                            case 'bot': return m.user.bot;
                            case 'human': return !m.user.bot;
                            case 'online': return m.presence?.status === 'online';
                            case 'offline': return !m.presence || m.presence.status === 'offline';
                            case 'boosting': return m.premiumSince !== null;
                            default: return true;
                        }
                    });
                }

                return filtered.map(m => this.getMemberData(m, presence));
            }

            default:
                throw new Error('Invalid member action');
        }
    },

    /**
     * Get clean member data object
     */
    getMemberData(member, includePresence = false) {
        const data = {
            id: member.id,
            tag: member.user.tag,
            displayName: member.displayName,
            nickname: member.nickname,
            bot: member.user.bot,
            joinedAt: member.joinedAt,
            roles: member.roles.cache
                .filter(r => r.id !== member.guild.id)
                .map(r => ({
                    id: r.id,
                    name: r.name
                })),
            permissions: member.permissions.toArray(),
            avatar: member.displayAvatarURL({ dynamic: true }),
            timeout: member.communicationDisabledUntil,
            voice: member.voice.channelId ? {
                channelId: member.voice.channelId,
                muted: member.voice.mute,
                deafened: member.voice.deaf,
                streaming: member.voice.streaming,
                video: member.voice.selfVideo
            } : null
        };

        if (includePresence && member.presence) {
            data.presence = {
                status: member.presence.status,
                activities: member.presence.activities.map(a => ({
                    name: a.name,
                    type: a.type,
                    state: a.state,
                    details: a.details,
                    url: a.url
                }))
            };
        }

        return data;
    }
};
