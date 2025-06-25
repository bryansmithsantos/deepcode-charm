/**
 * Common validation schemas
 * @module utils/schemas
 */

// Common string patterns
const patterns = {
    username: '^[a-zA-Z0-9_]{3,32}$',
    email: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    url: '^https?://[\\w.-]+\\.[a-zA-Z]{2,}[\\w\\-._~:/?#[\\]@!$&\'()*+,;=]*$',
    hexColor: '^#[0-9a-fA-F]{6}$',
    discordId: '^\\d{17,19}$',
    channelMention: '^<#\\d{17,19}>$',
    roleMention: '^<@&\\d{17,19}>$',
    userMention: '^<@!?\\d{17,19}>$'
};

// Basic types
const types = {
    snowflake: {
        type: 'string',
        pattern: patterns.discordId,
        patternMessage: 'Must be a valid Discord ID'
    },
    username: {
        type: 'string',
        pattern: patterns.username,
        patternMessage: 'Username must be 3-32 characters and contain only letters, numbers, and underscores'
    },
    email: {
        type: 'string',
        pattern: patterns.email,
        patternMessage: 'Must be a valid email address'
    },
    url: {
        type: 'string',
        pattern: patterns.url,
        patternMessage: 'Must be a valid URL starting with http:// or https://'
    },
    color: {
        type: 'string',
        pattern: patterns.hexColor,
        patternMessage: 'Must be a valid hex color (e.g. #FF0000)'
    }
};

// Common schemas
module.exports = {
    // User profile schema
    profile: {
        type: 'object',
        properties: {
            username: types.username,
            email: types.email,
            avatar: types.url,
            bio: {
                type: 'string',
                maxLength: 500
            },
            age: {
                type: 'number',
                min: 13,
                max: 120,
                integer: true
            },
            social: {
                type: 'object',
                properties: {
                    twitter: types.url,
                    github: types.url,
                    website: types.url
                }
            }
        }
    },

    // Server settings schema
    serverSettings: {
        type: 'object',
        properties: {
            prefix: {
                type: 'string',
                minLength: 1,
                maxLength: 5
            },
            modRoles: {
                type: 'array',
                itemType: 'string',
                itemRules: types.snowflake
            },
            logChannel: types.snowflake,
            welcomeChannel: types.snowflake,
            autoRole: types.snowflake,
            modules: {
                type: 'object',
                properties: {
                    welcome: { type: 'boolean' },
                    automod: { type: 'boolean' },
                    levels: { type: 'boolean' }
                }
            }
        }
    },

    // Command arguments schema
    command: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 32,
                pattern: '^[a-zA-Z0-9-]+$',
                patternMessage: 'Command name can only contain letters, numbers, and hyphens'
            },
            description: {
                type: 'string',
                maxLength: 100
            },
            usage: {
                type: 'string',
                maxLength: 200
            },
            aliases: {
                type: 'array',
                itemType: 'string',
                maxItems: 5
            },
            permissions: {
                type: 'array',
                itemType: 'string',
                itemRules: {
                    enum: [
                        'ADMINISTRATOR',
                        'MANAGE_GUILD',
                        'MANAGE_MESSAGES',
                        'KICK_MEMBERS',
                        'BAN_MEMBERS'
                    ]
                }
            }
        }
    },

    // Economy item schema
    item: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-_]+$',
                patternMessage: 'Item ID can only contain letters, numbers, hyphens, and underscores'
            },
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 50
            },
            description: {
                type: 'string',
                maxLength: 200
            },
            price: {
                type: 'number',
                min: 0,
                integer: true
            },
            category: {
                type: 'string',
                enum: ['role', 'badge', 'consumable', 'collectible']
            },
            effects: {
                type: 'array',
                itemType: 'object',
                itemRules: {
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['add_role', 'remove_role', 'give_money', 'give_xp']
                        },
                        value: { type: 'string' }
                    }
                }
            }
        }
    },

    // Message content filters
    filter: {
        type: 'object',
        properties: {
            enabled: { type: 'boolean' },
            words: {
                type: 'array',
                itemType: 'string'
            },
            patterns: {
                type: 'array',
                itemType: 'string'
            },
            ignoreRoles: {
                type: 'array',
                itemType: 'string',
                itemRules: types.snowflake
            },
            ignoredChannels: {
                type: 'array',
                itemType: 'string',
                itemRules: types.snowflake
            },
            actions: {
                type: 'array',
                itemType: 'string',
                itemRules: {
                    enum: ['delete', 'warn', 'timeout', 'kick', 'ban']
                }
            }
        }
    },

    // Common patterns
    patterns,

    // Basic types
    types
};
