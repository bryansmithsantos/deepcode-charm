/**
 * Track charm - Event tracking and analytics
 * Tier 2 primitive for tracking user actions and events
 * 
 * Examples:
 * $track[event, { "name": "user_join", "user": "123456789", "data": {...} }] - Track event
 * $track[get, { "event": "user_join", "timeframe": "24h" }] - Get tracked events
 * $track[stats, "user_join"] - Get event statistics
 */
module.exports = {
    name: 'track',
    description: 'Event tracking and analytics system',
    tier: 2,

    // Static storage for tracked events
    _events: new Map(),
    _stats: new Map(),

    async execute(args, context) {
        // Handle simple format: $track[eventName]
        if (typeof args === 'string') {
            return this.getEventStats(args);
        }

        const { 
            action = 'event',
            name,
            event,
            user,
            data,
            timeframe = '24h',
            format = 'array'
        } = args;

        switch (action.toLowerCase()) {
            case 'event':
            case 'log':
                return this.trackEvent(name || event, user, data, context);

            case 'get':
            case 'list':
                return this.getEvents(name || event, timeframe, format);

            case 'stats':
            case 'statistics':
                return this.getEventStats(name || event, timeframe);

            case 'user':
                return this.getUserEvents(user, timeframe, format);

            case 'clear':
                return this.clearEvents(name || event);

            case 'count':
                return this.countEvents(name || event, timeframe);

            case 'recent':
                return this.getRecentEvents(name || event, args.limit || 10);

            default:
                throw new Error(`Unknown track action: ${action}`);
        }
    },

    /**
     * Track an event
     */
    trackEvent(eventName, userId, eventData, context) {
        if (!eventName) {
            throw new Error('Event name is required');
        }

        const timestamp = Date.now();
        const eventId = `${eventName}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

        const event = {
            id: eventId,
            name: eventName,
            user: userId || context.message?.author?.id || null,
            data: eventData || {},
            timestamp: timestamp,
            date: new Date(timestamp).toISOString(),
            context: {
                guild: context.message?.guild?.id || null,
                channel: context.message?.channel?.id || null,
                command: context.command || null
            }
        };

        // Store event
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        this._events.get(eventName).push(event);

        // Update statistics
        this.updateStats(eventName, event);

        // Clean old events (keep last 1000 per event type)
        const events = this._events.get(eventName);
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }

        return {
            success: true,
            event: {
                id: eventId,
                name: eventName,
                timestamp: timestamp,
                tracked: true
            }
        };
    },

    /**
     * Get events by name and timeframe
     */
    getEvents(eventName, timeframe, format) {
        if (!eventName) {
            // Get all events
            const allEvents = [];
            for (const events of this._events.values()) {
                allEvents.push(...events);
            }
            return this.filterByTimeframe(allEvents, timeframe, format);
        }

        const events = this._events.get(eventName) || [];
        return this.filterByTimeframe(events, timeframe, format);
    },

    /**
     * Get event statistics
     */
    getEventStats(eventName, timeframe = '24h') {
        if (!eventName) {
            // Get stats for all events
            const allStats = {};
            for (const [name, stats] of this._stats.entries()) {
                allStats[name] = this.calculateTimeframeStats(name, timeframe);
            }
            return allStats;
        }

        return this.calculateTimeframeStats(eventName, timeframe);
    },

    /**
     * Get events for specific user
     */
    getUserEvents(userId, timeframe, format) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const userEvents = [];
        for (const events of this._events.values()) {
            const filteredEvents = events.filter(event => event.user === userId);
            userEvents.push(...filteredEvents);
        }

        return this.filterByTimeframe(userEvents, timeframe, format);
    },

    /**
     * Clear events
     */
    clearEvents(eventName) {
        if (!eventName) {
            // Clear all events
            const totalCleared = Array.from(this._events.values())
                .reduce((sum, events) => sum + events.length, 0);
            
            this._events.clear();
            this._stats.clear();
            
            return {
                success: true,
                cleared: 'all',
                count: totalCleared
            };
        }

        const events = this._events.get(eventName) || [];
        const count = events.length;
        
        this._events.delete(eventName);
        this._stats.delete(eventName);

        return {
            success: true,
            cleared: eventName,
            count: count
        };
    },

    /**
     * Count events
     */
    countEvents(eventName, timeframe) {
        const events = this.getEvents(eventName, timeframe, 'array');
        return Array.isArray(events) ? events.length : 0;
    },

    /**
     * Get recent events
     */
    getRecentEvents(eventName, limit = 10) {
        const events = this._events.get(eventName) || [];
        return events
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit)
            .map(event => ({
                id: event.id,
                name: event.name,
                user: event.user,
                timestamp: event.timestamp,
                date: event.date,
                data: event.data
            }));
    },

    /**
     * Update statistics for event
     */
    updateStats(eventName, event) {
        if (!this._stats.has(eventName)) {
            this._stats.set(eventName, {
                total: 0,
                today: 0,
                thisHour: 0,
                lastUpdate: Date.now(),
                users: new Set(),
                firstSeen: event.timestamp,
                lastSeen: event.timestamp
            });
        }

        const stats = this._stats.get(eventName);
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        const dayAgo = now - (24 * 60 * 60 * 1000);

        // Update counters
        stats.total++;
        stats.lastSeen = event.timestamp;
        
        if (event.timestamp > hourAgo) {
            stats.thisHour++;
        }
        
        if (event.timestamp > dayAgo) {
            stats.today++;
        }

        if (event.user) {
            stats.users.add(event.user);
        }

        stats.lastUpdate = now;
    },

    /**
     * Calculate statistics for timeframe
     */
    calculateTimeframeStats(eventName, timeframe) {
        const events = this._events.get(eventName) || [];
        const timeframeMs = this.parseTimeframe(timeframe);
        const cutoff = Date.now() - timeframeMs;

        const filteredEvents = events.filter(event => event.timestamp > cutoff);
        const users = new Set(filteredEvents.map(e => e.user).filter(Boolean));

        const stats = this._stats.get(eventName);

        return {
            event: eventName,
            timeframe: timeframe,
            count: filteredEvents.length,
            uniqueUsers: users.size,
            total: stats?.total || 0,
            firstSeen: stats?.firstSeen || null,
            lastSeen: stats?.lastSeen || null,
            averagePerHour: timeframeMs >= 3600000 ? 
                Math.round(filteredEvents.length / (timeframeMs / 3600000)) : 0,
            averagePerDay: timeframeMs >= 86400000 ? 
                Math.round(filteredEvents.length / (timeframeMs / 86400000)) : 0
        };
    },

    /**
     * Filter events by timeframe
     */
    filterByTimeframe(events, timeframe, format) {
        const timeframeMs = this.parseTimeframe(timeframe);
        const cutoff = Date.now() - timeframeMs;

        const filteredEvents = events
            .filter(event => event.timestamp > cutoff)
            .sort((a, b) => b.timestamp - a.timestamp);

        return this.formatOutput(filteredEvents, format);
    },

    /**
     * Parse timeframe string to milliseconds
     */
    parseTimeframe(timeframe) {
        const match = timeframe.toString().match(/^(\d+)(m|h|d|w)?$/i);
        if (!match) {
            return 24 * 60 * 60 * 1000; // Default 24 hours
        }

        const [, amount, unit] = match;
        const num = parseInt(amount);

        switch ((unit || 'h').toLowerCase()) {
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            case 'w': return num * 7 * 24 * 60 * 60 * 1000;
            default: return num * 60 * 60 * 1000; // Default to hours
        }
    },

    /**
     * Format output based on requested format
     */
    formatOutput(events, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(events);
                
            case 'count':
                return events.length;
                
            case 'summary':
                return events.map(event => ({
                    name: event.name,
                    user: event.user,
                    timestamp: event.timestamp
                }));
                
            case 'users':
                return [...new Set(events.map(e => e.user).filter(Boolean))];
                
            case 'timeline':
                return events.map(event => ({
                    timestamp: event.timestamp,
                    date: event.date,
                    event: event.name,
                    user: event.user
                }));
                
            case 'array':
            default:
                return events;
        }
    }
};
