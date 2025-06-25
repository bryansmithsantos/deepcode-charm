/**
 * Event charm - Event management and custom event system
 * Tier 3 primitive for event handling
 * 
 * Examples:
 * $event[emit, { "name": "user_level_up", "data": {...} }] - Emit custom event
 * $event[listen, { "event": "messageCreate", "action": "log_message" }] - Listen to Discord event
 * $event[remove, "listener_id"] - Remove event listener
 */
module.exports = {
    name: 'event',
    description: 'Event management and custom event system',
    tier: 3,

    // Static storage for event listeners and custom events
    _listeners: new Map(),
    _customEvents: new Map(),
    _eventHistory: new Map(),

    async execute(args, context) {
        const { 
            action = 'emit',
            name,
            event,
            data,
            listener,
            once = false,
            condition
        } = args;

        switch (action.toLowerCase()) {
            case 'emit':
            case 'trigger':
                return await this.emitEvent(name || event, data, context);

            case 'listen':
            case 'on':
                return this.addEventListener(event || name, args, context);

            case 'once':
                return this.addEventListener(event || name, { ...args, once: true }, context);

            case 'remove':
            case 'off':
                return this.removeEventListener(listener || name);

            case 'list':
                return this.listEventListeners(name);

            case 'history':
                return this.getEventHistory(name);

            case 'clear':
                return this.clearEvents(name);

            case 'count':
                return this.countEvents(name);

            default:
                throw new Error(`Unknown event action: ${action}`);
        }
    },

    /**
     * Emit custom event
     */
    async emitEvent(eventName, eventData, context) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        const event = {
            name: eventName,
            data: eventData || {},
            timestamp: Date.now(),
            context: {
                guild: context.message?.guild?.id || null,
                channel: context.message?.channel?.id || null,
                user: context.message?.author?.id || null
            }
        };

        // Store in history
        if (!this._eventHistory.has(eventName)) {
            this._eventHistory.set(eventName, []);
        }
        const history = this._eventHistory.get(eventName);
        history.push(event);

        // Keep only last 100 events per type
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        // Execute listeners
        const listeners = this._listeners.get(eventName) || [];
        const results = [];

        for (const listener of listeners) {
            try {
                // Check condition if specified
                if (listener.condition && !this.checkCondition(listener.condition, event, context)) {
                    continue;
                }

                const result = await this.executeListener(listener, event, context);
                results.push(result);

                // Remove one-time listeners
                if (listener.once) {
                    this.removeEventListener(listener.id);
                }
            } catch (error) {
                console.error(`Error executing event listener ${listener.id}:`, error);
            }
        }

        return {
            success: true,
            event: eventName,
            timestamp: event.timestamp,
            listenersExecuted: results.length,
            results: results
        };
    },

    /**
     * Add event listener
     */
    addEventListener(eventName, options, context) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        const { 
            action, 
            command, 
            once = false, 
            condition,
            priority = 0
        } = options;

        if (!action && !command) {
            throw new Error('Action or command is required for event listener');
        }

        const listenerId = `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const listener = {
            id: listenerId,
            event: eventName,
            action: action || command,
            once: once,
            condition: condition,
            priority: priority,
            createdAt: Date.now(),
            context: {
                guild: context.message?.guild?.id || null,
                channel: context.message?.channel?.id || null,
                user: context.message?.author?.id || null
            }
        };

        // Store listener
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, []);
        }
        
        const listeners = this._listeners.get(eventName);
        listeners.push(listener);
        
        // Sort by priority (higher priority first)
        listeners.sort((a, b) => b.priority - a.priority);

        // Register Discord event listener if it's a Discord event
        if (this.isDiscordEvent(eventName)) {
            this.registerDiscordEventListener(eventName, context);
        }

        return {
            success: true,
            listenerId: listenerId,
            event: eventName,
            once: once,
            priority: priority
        };
    },

    /**
     * Remove event listener
     */
    removeEventListener(listenerId) {
        if (!listenerId) {
            throw new Error('Listener ID is required');
        }

        let removed = false;
        let eventName = null;

        for (const [event, listeners] of this._listeners.entries()) {
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
                eventName = event;
                
                // Clean up empty arrays
                if (listeners.length === 0) {
                    this._listeners.delete(event);
                }
                break;
            }
        }

        return {
            success: removed,
            listenerId: listenerId,
            event: eventName,
            removed: removed
        };
    },

    /**
     * List event listeners
     */
    listEventListeners(eventName) {
        if (eventName) {
            const listeners = this._listeners.get(eventName) || [];
            return listeners.map(l => ({
                id: l.id,
                event: l.event,
                action: l.action,
                once: l.once,
                priority: l.priority,
                createdAt: l.createdAt
            }));
        }

        // List all listeners
        const allListeners = [];
        for (const [event, listeners] of this._listeners.entries()) {
            for (const listener of listeners) {
                allListeners.push({
                    id: listener.id,
                    event: event,
                    action: listener.action,
                    once: listener.once,
                    priority: listener.priority,
                    createdAt: listener.createdAt
                });
            }
        }

        return allListeners;
    },

    /**
     * Get event history
     */
    getEventHistory(eventName) {
        if (eventName) {
            return this._eventHistory.get(eventName) || [];
        }

        // Get all event history
        const allHistory = [];
        for (const [event, history] of this._eventHistory.entries()) {
            allHistory.push(...history.map(h => ({ ...h, event })));
        }

        return allHistory.sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Clear events
     */
    clearEvents(eventName) {
        if (eventName) {
            const historyCount = (this._eventHistory.get(eventName) || []).length;
            const listenersCount = (this._listeners.get(eventName) || []).length;
            
            this._eventHistory.delete(eventName);
            this._listeners.delete(eventName);
            
            return {
                success: true,
                event: eventName,
                clearedHistory: historyCount,
                clearedListeners: listenersCount
            };
        }

        // Clear all
        const totalHistory = Array.from(this._eventHistory.values())
            .reduce((sum, history) => sum + history.length, 0);
        const totalListeners = Array.from(this._listeners.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);

        this._eventHistory.clear();
        this._listeners.clear();

        return {
            success: true,
            clearedHistory: totalHistory,
            clearedListeners: totalListeners
        };
    },

    /**
     * Count events
     */
    countEvents(eventName) {
        if (eventName) {
            return {
                event: eventName,
                historyCount: (this._eventHistory.get(eventName) || []).length,
                listenersCount: (this._listeners.get(eventName) || []).length
            };
        }

        return {
            totalEvents: this._eventHistory.size,
            totalListeners: this._listeners.size,
            totalHistory: Array.from(this._eventHistory.values())
                .reduce((sum, history) => sum + history.length, 0),
            totalActiveListeners: Array.from(this._listeners.values())
                .reduce((sum, listeners) => sum + listeners.length, 0)
        };
    },

    /**
     * Execute event listener
     */
    async executeListener(listener, event, context) {
        try {
            const result = {
                listenerId: listener.id,
                action: listener.action,
                executed: true,
                timestamp: Date.now()
            };
            
            return result;
        } catch (error) {
            return {
                listenerId: listener.id,
                action: listener.action,
                executed: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    },

    /**
     * Check if condition is met
     */
    checkCondition(condition, event, context) {
        if (typeof condition === 'string') {
            return event.data[condition] !== undefined;
        }

        if (typeof condition === 'object') {
            for (const [key, value] of Object.entries(condition)) {
                if (event.data[key] !== value) {
                    return false;
                }
            }
            return true;
        }

        if (typeof condition === 'function') {
            return condition(event, context);
        }

        return true;
    },

    /**
     * Check if event name is a Discord event
     */
    isDiscordEvent(eventName) {
        const discordEvents = [
            'messageCreate', 'messageDelete', 'messageUpdate',
            'guildMemberAdd', 'guildMemberRemove', 'guildMemberUpdate',
            'channelCreate', 'channelDelete', 'channelUpdate',
            'roleCreate', 'roleDelete', 'roleUpdate',
            'emojiCreate', 'emojiDelete', 'emojiUpdate',
            'ready', 'error', 'warn'
        ];

        return discordEvents.includes(eventName);
    },

    /**
     * Register Discord event listener
     */
    registerDiscordEventListener(eventName, context) {
        if (this._customEvents.has(eventName)) {
            return;
        }

        const client = context.client;
        
        const handler = (...args) => {
            const eventData = this.formatDiscordEvent(eventName, args);
            this.emitEvent(eventName, eventData, context);
        };

        client.on(eventName, handler);
        this._customEvents.set(eventName, handler);
    },

    /**
     * Format Discord event data
     */
    formatDiscordEvent(eventName, args) {
        switch (eventName) {
            case 'messageCreate':
                const [message] = args;
                return {
                    messageId: message.id,
                    content: message.content,
                    authorId: message.author.id,
                    channelId: message.channel.id,
                    guildId: message.guild?.id || null
                };

            case 'guildMemberAdd':
                const [member] = args;
                return {
                    userId: member.id,
                    guildId: member.guild.id,
                    joinedAt: member.joinedAt
                };

            default:
                return { args: args };
        }
    }
};
