/**
 * Embed charm - Advanced embed builder
 */
module.exports = {
    name: 'embed',
    description: 'Create and manage rich embeds',

    async execute(args, context) {
        const { action = 'create', options = {} } = args;

        switch (action.toLowerCase()) {
            case 'create': {
                const embed = this.createEmbed(options);
                return embed;
            }

            case 'edit': {
                const { messageId, embed } = options;
                const message = messageId ? 
                    await context.channel.messages.fetch(messageId) :
                    context.message;

                const embeds = [...(message.embeds || [])];
                const index = options.index || 0;
                
                if (embed.extends) {
                    embeds[index] = {
                        ...embeds[index],
                        ...this.createEmbed(embed)
                    };
                } else {
                    embeds[index] = this.createEmbed(embed);
                }

                await message.edit({ embeds });
                return embeds[index];
            }

            case 'add': {
                const { messageId, embed } = options;
                const message = messageId ? 
                    await context.channel.messages.fetch(messageId) :
                    context.message;

                const embeds = [...(message.embeds || [])];
                embeds.push(this.createEmbed(embed));

                await message.edit({ embeds });
                return embeds;
            }

            case 'remove': {
                const { messageId, index = -1 } = options;
                const message = messageId ? 
                    await context.channel.messages.fetch(messageId) :
                    context.message;

                const embeds = [...(message.embeds || [])];
                if (index >= 0) {
                    embeds.splice(index, 1);
                } else {
                    embeds.pop();
                }

                await message.edit({ embeds });
                return embeds;
            }

            case 'clear': {
                const { messageId } = options;
                const message = messageId ? 
                    await context.channel.messages.fetch(messageId) :
                    context.message;

                await message.edit({ embeds: [] });
                return [];
            }

            default:
                throw new Error('Invalid embed action');
        }
    },

    /**
     * Create embed object from options
     */
    createEmbed(options) {
        const {
            title,
            description,
            url,
            timestamp,
            color,
            footer,
            image,
            thumbnail,
            author,
            fields = []
        } = options;

        const embed = {};

        // Basic properties
        if (title) embed.title = title;
        if (description) embed.description = description;
        if (url) embed.url = url;
        if (timestamp) embed.timestamp = timestamp === true ? new Date() : timestamp;
        if (color) embed.color = this.resolveColor(color);

        // Footer
        if (footer) {
            embed.footer = {
                text: footer.text,
                icon_url: footer.iconURL
            };
        }

        // Images
        if (image) {
            embed.image = { url: image };
        }
        if (thumbnail) {
            embed.thumbnail = { url: thumbnail };
        }

        // Author
        if (author) {
            embed.author = {
                name: author.name,
                url: author.url,
                icon_url: author.iconURL
            };
        }

        // Fields
        if (fields.length > 0) {
            embed.fields = fields.map(field => ({
                name: field.name,
                value: field.value,
                inline: field.inline
            }));
        }

        return embed;
    },

    /**
     * Resolve color value
     */
    resolveColor(color) {
        if (typeof color === 'string') {
            // Handle hex colors
            if (color.startsWith('#')) {
                return parseInt(color.slice(1), 16);
            }
            
            // Handle named colors
            const colors = {
                'DEFAULT': 0x000000,
                'WHITE': 0xFFFFFF,
                'AQUA': 0x1ABC9C,
                'GREEN': 0x57F287,
                'BLUE': 0x3498DB,
                'YELLOW': 0xFEE75C,
                'PURPLE': 0x9B59B6,
                'PINK': 0xEB459E,
                'RED': 0xED4245,
                'ORANGE': 0xE67E22,
                'GREY': 0x95A5A6,
                'NAVY': 0x34495E,
                'DARK_AQUA': 0x11806A,
                'DARK_GREEN': 0x1F8B4C,
                'DARK_BLUE': 0x206694,
                'DARK_PURPLE': 0x71368A,
                'DARK_PINK': 0xAD1457,
                'DARK_RED': 0x992D22,
                'DARK_ORANGE': 0xA84300,
                'DARK_GREY': 0x979C9F,
                'DARKER_GREY': 0x7F8C8D,
                'LIGHT_GREY': 0xBCC0C0,
                'BLURPLE': 0x5865F2,
                'GREYPLE': 0x99AAB5,
                'DARK_BUT_NOT_BLACK': 0x2C2F33,
                'NOT_QUITE_BLACK': 0x23272A
            };
            return colors[color.toUpperCase()] || colors.DEFAULT;
        }
        return color;
    }
};
