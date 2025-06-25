/**
 * Server charm - Get server/guild information and properties
 * Tier 1 primitive for server data access
 */
module.exports = {
    name: 'server',
    description: 'Get server/guild information and properties',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $server[name]
        if (typeof args === 'string') {
            return this.getServerProperty(context.message.guild, args);
        }

        const { property = 'name', format = 'string' } = args;
        const guild = context.message.guild;

        if (!guild) {
            throw new Error('Command must be used in a server');
        }

        const result = this.getServerProperty(guild, property);
        return this.formatResult(result, format);
    },

    /**
     * Get specific server property
     */
    getServerProperty(guild, property) {
        switch (property.toLowerCase()) {
            // Basic guild properties
            case 'id':
                return guild.id;
            case 'name':
                return guild.name;
            case 'description':
                return guild.description;
            case 'acronym':
                return guild.nameAcronym;

            // Visual elements
            case 'icon':
            case 'iconurl':
                return guild.iconURL({ size: 512 });
            case 'banner':
            case 'bannerurl':
                return guild.bannerURL({ size: 1024 });
            case 'splash':
            case 'splashurl':
                return guild.splashURL({ size: 1024 });
            case 'discoverysplash':
                return guild.discoverySplashURL({ size: 1024 });

            // Owner and management
            case 'owner':
            case 'ownerid':
                return guild.ownerId;
            case 'ownertag':
                return guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown';

            // Counts
            case 'membercount':
            case 'members':
                return guild.memberCount;
            case 'channelcount':
            case 'channels':
                return guild.channels.cache.size;
            case 'rolecount':
            case 'roles':
                return guild.roles.cache.size;
            case 'emojicount':
            case 'emojis':
                return guild.emojis.cache.size;
            case 'stickercount':
            case 'stickers':
                return guild.stickers.cache.size;
            case 'boostcount':
            case 'boosts':
                return guild.premiumSubscriptionCount;

            // Channel counts by type
            case 'textchannels':
                return guild.channels.cache.filter(c => c.type === 0).size;
            case 'voicechannels':
                return guild.channels.cache.filter(c => c.type === 2).size;
            case 'categories':
                return guild.channels.cache.filter(c => c.type === 4).size;
            case 'threads':
                return guild.channels.cache.filter(c => [10, 11, 12].includes(c.type)).size;

            // Member counts by status
            case 'onlinemembers':
                return guild.members.cache.filter(m => m.presence?.status === 'online').size;
            case 'offlinemembers':
                return guild.members.cache.filter(m => !m.presence || m.presence.status === 'offline').size;
            case 'botcount':
                return guild.members.cache.filter(m => m.user.bot).size;
            case 'humancount':
                return guild.members.cache.filter(m => !m.user.bot).size;

            // Timestamps
            case 'created':
            case 'createdat':
                return guild.createdAt;
            case 'createdtimestamp':
                return guild.createdTimestamp;

            // Server features and settings
            case 'features':
                return guild.features;
            case 'verified':
                return guild.verified;
            case 'partnered':
                return guild.partnered;
            case 'boostlevel':
            case 'premiumtier':
                return guild.premiumTier;
            case 'vanityurl':
                return guild.vanityURLCode;
            case 'vanityuses':
                return guild.vanityURLUses;

            // Verification and content filter
            case 'verificationlevel':
                return guild.verificationLevel;
            case 'contentfilter':
            case 'explicitcontentfilter':
                return guild.explicitContentFilter;
            case 'mfalevel':
                return guild.mfaLevel;

            // Locale and region
            case 'locale':
                return guild.preferredLocale;
            case 'region':
                return guild.region || 'auto';

            // System channel
            case 'systemchannel':
                return guild.systemChannelId;
            case 'systemchannelname':
                return guild.systemChannel?.name || null;
            case 'ruleschannel':
                return guild.rulesChannelId;
            case 'ruleschannelname':
                return guild.rulesChannel?.name || null;
            case 'publicupdateschannel':
                return guild.publicUpdatesChannelId;
            case 'publicupdateschannelname':
                return guild.publicUpdatesChannel?.name || null;

            // AFK settings
            case 'afkchannel':
                return guild.afkChannelId;
            case 'afkchannelname':
                return guild.afkChannel?.name || null;
            case 'afktimeout':
                return guild.afkTimeout;

            // Widget
            case 'widgetenabled':
                return guild.widgetEnabled;
            case 'widgetchannel':
                return guild.widgetChannelId;

            // Large guild
            case 'large':
                return guild.large;

            // Available
            case 'available':
                return guild.available;

            default:
                throw new Error(`Unknown server property: ${property}`);
        }
    },

    /**
     * Format result based on requested format
     */
    formatResult(result, format) {
        switch (format.toLowerCase()) {
            case 'string':
                if (Array.isArray(result)) {
                    return result.join(', ');
                }
                return result?.toString() || '';

            case 'array':
                if (Array.isArray(result)) {
                    return result;
                }
                return [result];

            case 'json':
                return JSON.stringify(result);

            case 'count':
                if (Array.isArray(result)) {
                    return result.length;
                }
                return result ? 1 : 0;

            case 'boolean':
                return Boolean(result);

            case 'timestamp':
                if (result instanceof Date) {
                    return Math.floor(result.getTime() / 1000);
                }
                return result;

            case 'relative':
                if (result instanceof Date) {
                    return `<t:${Math.floor(result.getTime() / 1000)}:R>`;
                }
                return result;

            default:
                return result;
        }
    }
};
