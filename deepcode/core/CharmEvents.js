/**
 * CharmEvents - Simplified event handling system
 * @module core/CharmEvents
 */
const { Collection } = require('discord.js');
const { EventEmitter } = require('events');

class CharmEvents extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.events = new Collection();
        
        // Event name mappings (friendly names to Discord.js events)
        this.eventMap = {
            // Tier 1 Events (Basic)
            'OnReady': 'ready',
            'OnMessage': 'messageCreate',
            'OnCommand': 'commandCreate',
            'OnError': 'error',
            
            // Tier 2 Events (Intermediate)
            'OnMemberJoin': 'guildMemberAdd',
            'OnMemberLeave': 'guildMemberRemove',
            'OnReaction': 'messageReactionAdd',
            'OnReactionRemove': 'messageReactionRemove',
            'OnChannelCreate': 'channelCreate',
            'OnChannelDelete': 'channelDelete',
            'OnRoleCreate': 'roleCreate',
            'OnRoleDelete': 'roleDelete',
            
            // Tier 3 Events (Advanced)
            'OnVoiceJoin': 'voiceStateUpdate',
            'OnVoiceLeave': 'voiceStateUpdate',
            'OnBan': 'guildBanAdd',
            'OnUnban': 'guildBanRemove',
            'OnEmojisUpdate': 'emojiUpdate',
            'OnGuildJoin': 'guildCreate',
            'OnGuildLeave': 'guildDelete',
            'OnWebhook': 'webhookUpdate',
            'OnInteraction': 'interactionCreate',
            'OnThreadCreate': 'threadCreate',
            'OnThreadDelete': 'threadDelete',
            'OnPresenceUpdate': 'presenceUpdate',
            'OnTypingStart': 'typingStart',
            'OnInviteCreate': 'inviteCreate',
            'OnInviteDelete': 'inviteDelete'
        };

        // Initialize event handlers
        this.initEvents();
    }

    /**
     * Initialize Discord.js event handlers
     * @private
     */
    initEvents() {
        Object.entries(this.eventMap).forEach(([friendlyName, discordEvent]) => {
            this.client.on(discordEvent, (...args) => {
                this.handleEvent(friendlyName, ...args);
            });
        });
    }

    /**
     * Register a new event handler
     * @param {string} eventName Friendly event name
     * @param {Function|string} handler Event handler function or charm code
     * @param {Object} options Event options
     */
    on(eventName, handler, options = {}) {
        const discordEvent = this.eventMap[eventName];
        if (!discordEvent) {
            throw new Error(`Unknown event: ${eventName}`);
        }

        if (typeof handler === 'string') {
            // Handle charm code
            const charmCode = handler;
            handler = async (...args) => {
                const context = {
                    event: args[0],
                    eventName,
                    ...options.variables
                };
                await this.client.engine.execute(charmCode, context);
            };
        }

        this.events.set(eventName, {
            name: eventName,
            discordEvent,
            handler,
            options
        });
    }

    /**
     * Handle an event
     * @private
     * @param {string} eventName Event name
     * @param  {...any} args Event arguments
     */
    async handleEvent(eventName, ...args) {
        const event = this.events.get(eventName);
        if (!event) return;

        try {
            await event.handler(...args);
        } catch (error) {
            console.error(`Error in event ${eventName}:`, error);
            this.emit('error', error);
        }
    }

    /**
     * Get documentation about available events
     * @returns {Object} Event documentation
     */
    static getEventDocs() {
        return {
            tier1: {
                title: 'Basic Events (Tier 1)',
                events: [
                    { name: 'OnReady', description: 'Bot is ready' },
                    { name: 'OnMessage', description: 'Message is sent' },
                    { name: 'OnCommand', description: 'Command is executed' },
                    { name: 'OnError', description: 'Error occurs' }
                ]
            },
            tier2: {
                title: 'Intermediate Events (Tier 2)',
                events: [
                    { name: 'OnMemberJoin', description: 'Member joins server' },
                    { name: 'OnMemberLeave', description: 'Member leaves server' },
                    { name: 'OnReaction', description: 'Reaction is added' },
                    { name: 'OnChannelCreate', description: 'Channel is created' },
                    { name: 'OnRoleCreate', description: 'Role is created' }
                ]
            },
            tier3: {
                title: 'Advanced Events (Tier 3)',
                events: [
                    { name: 'OnVoiceJoin', description: 'Member joins voice' },
                    { name: 'OnBan', description: 'Member is banned' },
                    { name: 'OnInteraction', description: 'Interaction is created' },
                    { name: 'OnWebhook', description: 'Webhook is updated' },
                    { name: 'OnPresenceUpdate', description: 'Member presence changes' }
                ]
            }
        };
    }
}

module.exports = CharmEvents;
