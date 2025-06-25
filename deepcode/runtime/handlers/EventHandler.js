const { Collection } = require('discord.js');
const { errors } = require('../../core');
const chalk = require('chalk');

/**
 * Event handler class
 */
class EventHandler {
    constructor(client) {
        this.client = client;
        this.events = new Collection();
        this.debug = client.debug || false;
        this.disabled = new Set();

        // Initialize handlers
        this.initSystemEvents();
    }

    /**
     * Initialize system event handlers
     */
    initSystemEvents() {
        // Handle raw events
        this.client.on('raw', packet => {
            this.handleRawEvent(packet).catch(error => {
                console.error(chalk.red('Error handling raw event:'), error);
            });
        });

        // Handle debug events
        if (this.debug) {
            this.client.on('debug', message => {
                console.log(chalk.gray('Event Debug:', message));
            });
        }
    }

    /**
     * Register an event handler
     */
    register(event) {
        try {
            // Validate event
            if (!event.name) {
                throw new errors.EventError('Event must have a name');
            }

            if (!event.execute && !event.run) {
                throw new errors.EventError('Event must have an execute or run method');
            }

            // Add execute method if using run
            if (!event.execute) {
                event.execute = event.run;
            }

            // Add handler to collection
            this.events.set(event.name, event);

            // Add event listener
            if (event.once) {
                this.client.once(event.name, (...args) => this.handleEvent(event, ...args));
            } else {
                this.client.on(event.name, (...args) => this.handleEvent(event, ...args));
            }

            if (this.debug) {
                console.log(chalk.gray(`Registered event: ${event.name}`));
            }

        } catch (error) {
            console.error(chalk.red(`Error registering event ${event.name}:`), error);
            throw error;
        }
    }

    /**
     * Unregister an event handler
     */
    unregister(name) {
        try {
            // Get event
            const event = this.events.get(name);
            if (!event) return false;

            // Remove listeners
            this.client.removeAllListeners(name);

            // Remove from collection
            this.events.delete(name);

            if (this.debug) {
                console.log(chalk.gray(`Unregistered event: ${name}`));
            }

            return true;

        } catch (error) {
            console.error(chalk.red(`Error unregistering event ${name}:`), error);
            throw error;
        }
    }

    /**
     * Handle an event
     */
    async handleEvent(event, ...args) {
        try {
            // Check if disabled
            if (this.disabled.has(event.name)) return;

            // Start performance timer
            const start = process.hrtime();

            // Execute event handler
            await event.execute(...args, this.client);

            // Performance tracking
            if (this.debug) {
                const [seconds, nanoseconds] = process.hrtime(start);
                const duration = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
                console.log(chalk.gray(`Event ${event.name} executed in ${duration}ms`));
            }

        } catch (error) {
            await this.handleError(error, event, ...args);
        }
    }

    /**
     * Handle raw events
     */
    async handleRawEvent(packet) {
        // Get event handler
        const event = this.events.get(`raw_${packet.t}`);
        if (!event) return;

        // Handle event
        await this.handleEvent(event, packet);
    }

    /**
     * Handle event error
     */
    async handleError(error, event, ...args) {
        // Log error
        console.error(chalk.red(`Error in event ${event.name}:`), error);

        // Plugin error hooks
        for (const plugin of this.client.plugins.values()) {
            if (plugin.onEventError) {
                await plugin.onEventError(error, event, ...args);
            }
        }

        // Emit error event
        this.client.emit('eventError', error, event, ...args);
    }

    /**
     * Enable an event
     */
    enable(name) {
        this.disabled.delete(name);
    }

    /**
     * Disable an event
     */
    disable(name) {
        this.disabled.add(name);
    }

    /**
     * Check if event is disabled
     */
    isDisabled(name) {
        return this.disabled.has(name);
    }

    /**
     * Get all event names
     */
    getEventNames() {
        return [...this.events.keys()];
    }

    /**
     * Get event handler
     */
    getEvent(name) {
        return this.events.get(name);
    }

    /**
     * Clear all events
     */
    clear() {
        // Remove all listeners
        for (const [name] of this.events) {
            this.client.removeAllListeners(name);
        }

        // Clear collections
        this.events.clear();
        this.disabled.clear();
    }

    /**
     * Get event stats
     */
    getStats() {
        return {
            total: this.events.size,
            disabled: this.disabled.size,
            enabled: this.events.size - this.disabled.size
        };
    }
}

module.exports = EventHandler;
