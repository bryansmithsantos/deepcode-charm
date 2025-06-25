const { Collection } = require('discord.js');

/**
 * Base handler class for managers
 */
class Handler {
    constructor(client, options = {}) {
        this.client = client;
        this.debug = client.debug || false;
        this.type = options.type || 'handler';
        
        // Initialize collections
        this.items = new Collection();
        this.disabled = new Collection();
    }

    /**
     * Get an item
     */
    get(name) {
        return this.items.get(name);
    }

    /**
     * Get all items
     */
    getAll() {
        return this.items;
    }

    /**
     * Get item names
     */
    getNames() {
        return [...this.items.keys()];
    }

    /**
     * Enable an item
     */
    enable(name) {
        this.disabled.delete(name);
        return true;
    }

    /**
     * Disable an item
     */
    disable(name) {
        if (!this.items.has(name)) {
            return false;
        }
        this.disabled.set(name, true);
        return true;
    }

    /**
     * Check if item is disabled
     */
    isDisabled(name) {
        return this.disabled.has(name);
    }

    /**
     * Clear all items
     */
    clear() {
        this.items.clear();
        this.disabled.clear();
        return true;
    }

    /**
     * Register an item
     */
    register(item) {
        if (!item?.name) {
            throw new Error(`${this.type} must have a name`);
        }

        if (this.items.has(item.name)) {
            throw new Error(`${this.type} ${item.name} already exists`);
        }

        this.items.set(item.name, item);

        if (this.debug) {
            console.log(`Registered ${this.type}: ${item.name}`);
        }

        return true;
    }

    /**
     * Unregister an item
     */
    unregister(name) {
        if (!this.items.has(name)) {
            return false;
        }

        this.items.delete(name);
        this.disabled.delete(name);

        if (this.debug) {
            console.log(`Unregistered ${this.type}: ${name}`);
        }

        return true;
    }

    /**
     * Get handler stats
     */
    getStats() {
        return {
            total: this.items.size,
            enabled: this.items.size - this.disabled.size,
            disabled: this.disabled.size
        };
    }

    /**
     * Handle errors
     */
    async handleError(error, context) {
        console.error(`Error in ${this.type}:`, error);

        // Execute error hooks
        if (this.client.plugins) {
            await this.client.plugins.executeHook('onError', error, context);
        }
    }
}

module.exports = Handler;
