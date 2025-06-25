/**
 * Test Utilities
 * Helper functions for testing the framework
 */
const fs = require('fs').promises;
const { join } = require('path');

/**
 * File operations
 */
const fileUtils = {
    /**
     * Check if file exists
     * @param {string} path File path
     * @returns {Promise<boolean>}
     */
    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Delete file if exists
     * @param {string} path File path
     */
    async deleteFile(path) {
        if (await this.fileExists(path)) {
            await fs.unlink(path);
        }
    },

    /**
     * Create directory if not exists
     * @param {string} path Directory path
     */
    async ensureDir(path) {
        if (!await this.fileExists(path)) {
            await fs.mkdir(path, { recursive: true });
        }
    }
};

/**
 * Mock Discord.js objects
 */
const mockObjects = {
    /**
     * Create mock message
     * @param {Object} options Message options
     */
    createMessage(options = {}) {
        return {
            content: options.content || '',
            author: {
                id: options.authorId || 'test-user',
                bot: options.isBot || false,
                tag: options.tag || 'Test#0000',
                ...options.author
            },
            member: {
                id: options.authorId || 'test-user',
                roles: {
                    cache: new Map(options.roles || [])
                },
                permissions: options.permissions || [],
                ...options.member
            },
            channel: {
                id: options.channelId || 'test-channel',
                type: options.channelType || 'GUILD_TEXT',
                send: jest.fn(),
                ...options.channel
            },
            guild: {
                id: options.guildId || 'test-guild',
                name: options.guildName || 'Test Guild',
                members: {
                    cache: new Map()
                },
                channels: {
                    cache: new Map()
                },
                roles: {
                    cache: new Map()
                },
                ...options.guild
            },
            mentions: {
                users: new Map(options.mentionedUsers || []),
                roles: new Map(options.mentionedRoles || []),
                channels: new Map(options.mentionedChannels || []),
                ...options.mentions
            },
            reply: jest.fn(),
            delete: jest.fn()
        };
    },

    /**
     * Create mock interaction
     * @param {Object} options Interaction options
     */
    createInteraction(options = {}) {
        return {
            commandName: options.commandName,
            options: new Map(options.options || []),
            user: {
                id: options.userId || 'test-user',
                bot: false,
                tag: options.tag || 'Test#0000',
                ...options.user
            },
            member: {
                id: options.userId || 'test-user',
                roles: {
                    cache: new Map(options.roles || [])
                },
                permissions: options.permissions || [],
                ...options.member
            },
            channel: {
                id: options.channelId || 'test-channel',
                type: options.channelType || 'GUILD_TEXT',
                send: jest.fn(),
                ...options.channel
            },
            guild: {
                id: options.guildId || 'test-guild',
                name: options.guildName || 'Test Guild',
                ...options.guild
            },
            reply: jest.fn(),
            deferReply: jest.fn(),
            editReply: jest.fn(),
            followUp: jest.fn(),
            isCommand: () => options.isCommand ?? true,
            isButton: () => options.isButton ?? false,
            isSelectMenu: () => options.isSelectMenu ?? false,
            isModalSubmit: () => options.isModalSubmit ?? false
        };
    }
};

/**
 * Test data generators
 */
const testData = {
    /**
     * Generate random string
     * @param {number} length String length
     */
    randomString(length = 10) {
        return Array(length)
            .fill()
            .map(() => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
            .join('');
    },

    /**
     * Generate random ID (Discord-like)
     */
    randomId() {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
    },

    /**
     * Generate random user data
     */
    randomUser() {
        const id = this.randomId();
        const username = this.randomString();
        return {
            id,
            username,
            tag: `${username}#${Math.floor(Math.random() * 9999)}`,
            bot: false
        };
    }
};

/**
 * Async test helpers
 */
const asyncUtils = {
    /**
     * Wait for specified time
     * @param {number} ms Time in milliseconds
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Wait for condition
     * @param {Function} condition Condition function
     * @param {number} timeout Timeout in milliseconds
     * @param {number} interval Check interval in milliseconds
     */
    async waitFor(condition, timeout = 5000, interval = 100) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition()) return true;
            await this.wait(interval);
        }
        throw new Error('Timeout waiting for condition');
    }
};

module.exports = {
    ...fileUtils,
    ...mockObjects,
    ...testData,
    ...asyncUtils
};
