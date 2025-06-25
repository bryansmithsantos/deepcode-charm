const { Collection } = require('discord.js');
const Handler = require('../runtime/handler');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs').promises;

/**
 * Formats milliseconds into a human-readable string (e.g., 1d 2h 3m 4s)
 * @param {number} ms - The number of milliseconds.
 * @returns {string} The formatted uptime string.
 */
function formatUptime(ms) {
    if (!ms) return '0s';

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}

/**
 * Variable manager for handling bot variables
 */
class VariableManager extends Handler {
    constructor(client) {
        super(client, { type: 'variable' });
        this.variables = new Collection();
        this.persistence = client.config?.variables?.persist || false;
        this.dataPath = path.join(process.cwd(), 'data', 'variables.json');

        this.registerSystemVariables();
    }

    /**
     * Register system variables.
     * Some variables are dynamic (functions) to provide real-time values.
     */
    registerSystemVariables() {
        this.set('ping', () => this.client.ws.ping ?? -1);
        this.set('uptime', () => formatUptime(this.client.uptime));
        this.set('guilds', () => this.client.guilds.cache.size);
        this.set('users', () => this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
        this.set('channels', () => this.client.channels.cache.size);
        this.set('timestamp', () => new Date().toISOString());
        this.set('memory', () => (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
        this.set('version', process.version);
    }

    /**
     * Get a variable value
     */
    get(key) {
        // Support dot notation
        const parts = key.split('.');
        let value = this.variables;

        for (const part of parts) {
            if (!value || typeof value !== 'object') return undefined;
            value = value.get?.(part) || value[part];
        }

        // If the value is a function, execute it to get the dynamic value
        if (typeof value === 'function') {
            try {
                return value();
            } catch (error) {
                console.error(`Error executing dynamic variable '${key}':`, error);
                return ''; // Return empty string on error
            }
        }

        return value;
    }

    /**
     * Set a variable value
     */
    set(key, value) {
        // Support dot notation
        const parts = key.split('.');
        const last = parts.pop();

        let target = this.variables;
        for (const part of parts) {
            if (!target.has(part)) {
                target.set(part, new Collection());
            }
            target = target.get(part);
        }

        target.set(last, value);

        if (this.persistence) {
            this.save().catch(error => {
                console.error('Error saving variables:', error);
            });
        }

        return true;
    }

    /**
     * Update multiple variables
     */
    update(key, values) {
        const current = this.get(key) || {};
        const updated = { ...current, ...values };
        return this.set(key, updated);
    }

    /**
     * Delete a variable
     */
    delete(key) {
        // Support dot notation
        const parts = key.split('.');
        const last = parts.pop();

        let target = this.variables;
        for (const part of parts) {
            target = target.get(part);
            if (!target) return false;
        }

        const result = target.delete(last);

        if (this.persistence) {
            this.save().catch(error => {
                console.error('Error saving variables:', error);
            });
        }

        return result;
    }

    /**
     * Clear all variables
     */
    clear() {
        this.variables.clear();

        if (this.persistence) {
            this.save().catch(error => {
                console.error('Error saving variables:', error);
            });
        }

        return true;
    }

    /**
     * Save variables to file
     */
    async save() {
        if (!this.persistence) return;

        try {
            const data = {};
            for (const [key, value] of this.variables) {
                data[key] = value;
            }

            await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
            await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));

            if (this.debug) {
                console.log(chalk.gray('Variables saved:', this.dataPath));
            }
        } catch (error) {
            console.error('Error saving variables:', error);
            throw error;
        }
    }

    /**
     * Load variables from file
     */
    async load() {
        try {
            const exists = await fs.access(this.dataPath)
                .then(() => true)
                .catch(() => false);

            if (!exists) return;

            const data = JSON.parse(await fs.readFile(this.dataPath, 'utf8'));
            for (const [key, value] of Object.entries(data)) {
                this.set(key, value);
            }

            if (this.debug) {
                console.log(chalk.gray('Variables loaded:', this.dataPath));
            }
        } catch (error) {
            console.error('Error loading variables:', error);
            throw error;
        }
    }

    /**
     * Get manager stats
     */
    getStats() {
        return {
            ...super.getStats(),
            persistence: this.persistence,
            variables: this.variables.size,
            storage: this.dataPath
        };
    }
}

module.exports = VariableManager;
