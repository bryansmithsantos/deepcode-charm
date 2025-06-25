const { Collection } = require('discord.js');
const Handler = require('../runtime/handler');
const chalk = require('chalk');

/**
 * Event manager for handling bot events
 */
class EventManager extends Handler {
    constructor(client) {
        super(client, { type: 'event' });
        this.rawEvents = new Collection();
        this.performance = new Collection();
        this.initSystemEvents();
    }

    /**
     * Initialize system events
     */
    initSystemEvents() {
        // Handle raw events
        this.client.on('raw', packet => {
            this.handleRawEvent(packet).catch(error => {
                console.error(chalk.red('Error handling raw event:'), error);
            });
        });

        // Debug logging
        if (this.debug) {
            this.client.on('debug', message => {
                console.log(chalk.gray('Discord Debug:'), message);
            });
        }
    }

    /**
     * Register an event
     */
    register(event) {
        try {
            // Validate event
            this.validateEvent(event);

            // Add event to collection
            this.items.set(event.name, event);

            // Register with Discord.js
            if (event.once) {
                this.client.once(event.name, (...args) => this.execute(event.name, ...args));
            } else {
                this.client.on(event.name, (...args) => this.execute(event.name, ...args));
            }

            if (this.debug) {
                console.log(chalk.gray(`Registered event: ${event.name}`));
            }

            return true;

        } catch (error) {
            console.error(chalk.red(`Error registering event ${event.name}:`), error);
            throw error;
        }
    }

    /**
     * Validate event structure
     */
    validateEvent(event) {
        if (!event?.name) {
            throw new Error('Event must have a name');
        }
        if (!event.execute && !event.run) {
            throw new Error('Event must have execute or run method');
        }
    }

    /**
     * Execute an event
     */
    async execute(name, ...args) {
        try {
            // Get event
            const event = this.get(name);
            if (!event) {
                throw new Error(`Event ${name} not found`);
            }

            // Check if disabled
            if (this.isDisabled(event.name)) {
                return false;
            }

            // Start performance timer
            const start = process.hrtime();

            // Execute event handler
            const result = await (event.execute || event.run).call(event, ...args, this.client);

            // Track performance
            const [seconds, nanoseconds] = process.hrtime(start);
            const duration = seconds * 1000 + nanoseconds / 1e6;
            this.trackEventPerformance(event.name, duration);

            return result;

        } catch (error) {
            await this.handleError(error, { name }, ...args);
            return false;
        }
    }

    /**
     * Handle raw Discord.js events
     */
    async handleRawEvent(packet) {
        // Get event handler
        const event = this.rawEvents.get(`raw_${packet.t}`);
        if (!event) return;

        try {
            // Execute event
            await this.execute(event.name, packet);
        } catch (error) {
            console.error(chalk.red(`Error handling raw event ${packet.t}:`), error);
        }
    }

    /**
     * Track event execution performance
     */
    trackEventPerformance(eventName, duration) {
        const stats = this.performance.get(eventName) || {
            count: 0,
            totalTime: 0,
            avgTime: 0
        };

        stats.count++;
        stats.totalTime += duration;
        stats.avgTime = stats.totalTime / stats.count;

        this.performance.set(eventName, stats);
    }

    /**
     * Get event performance stats
     */
    getPerformanceStats() {
        return Object.fromEntries(this.performance);
    }

    /**
     * Get manager stats
     */
    getStats() {
        return {
            ...super.getStats(),
            performance: this.getPerformanceStats()
        };
    }
}

module.exports = EventManager;
