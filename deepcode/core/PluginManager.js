const { Collection } = require('discord.js');
const { errors } = require('./index');
const Handler = require('../runtime/handler');
const chalk = require('chalk');

/**
 * Plugin manager for handling bot plugins
 */
class PluginManager extends Handler {
    constructor(client) {
        super(client, { type: 'plugin' });
        this.configs = new Collection();
        this.hooks = new Collection();
        this.initHooks();
    }

    /**
     * Initialize plugin hooks
     */
    initHooks() {
        this.hooks.set('onLoad', new Collection());
        this.hooks.set('onUnload', new Collection());
        this.hooks.set('onCommandPre', new Collection());
        this.hooks.set('onCommandPost', new Collection());
        this.hooks.set('onError', new Collection());
    }

    /**
     * Register a plugin
     */
    register(plugin) {
        try {
            // Validate plugin
            this.validatePlugin(plugin);

            // Add plugin to collection
            this.items.set(plugin.name, plugin);

            // Register plugin hooks
            this.registerHooks(plugin);

            // Load plugin config
            this.loadConfig(plugin);

            // Initialize plugin
            if (plugin.onLoad) {
                plugin.onLoad().catch(error => {
                    console.error(chalk.red(`Error loading plugin ${plugin.name}:`), error);
                });
            }

            if (this.debug) {
                console.log(chalk.gray(`Registered plugin: ${plugin.name} v${plugin.version || '1.0.0'}`));
            }

            return true;

        } catch (error) {
            console.error(chalk.red(`Error registering plugin ${plugin.name}:`), error);
            throw error;
        }
    }

    /**
     * Validate plugin structure
     */
    validatePlugin(plugin) {
        if (!plugin.name) {
            throw new errors.ValidationError('Plugin must have a name');
        }

        if (this.items.has(plugin.name)) {
            throw new errors.ValidationError(`Plugin ${plugin.name} already exists`);
        }

        if (typeof plugin !== 'object') {
            throw new errors.ValidationError('Plugin must be a class instance');
        }
    }

    /**
     * Register plugin hooks
     */
    registerHooks(plugin) {
        for (const [hookName, hookCollection] of this.hooks) {
            if (plugin[hookName]) {
                hookCollection.set(plugin.name, plugin[hookName].bind(plugin));
            }
        }
    }

    /**
     * Load plugin config
     */
    loadConfig(plugin) {
        // Get config from bot config
        const config = this.client.config?.plugins?.config?.[plugin.name] || {};

        // Merge with default config
        plugin.config = {
            ...plugin.defaultConfig,
            ...config
        };

        // Store config
        this.configs.set(plugin.name, plugin.config);
    }

    /**
     * Unregister a plugin
     */
    async unregister(name) {
        const plugin = this.get(name);
        if (!plugin) return false;

        try {
            // Run unload hook
            if (plugin.onUnload) {
                await plugin.onUnload();
            }

            // Remove hooks
            for (const hookCollection of this.hooks.values()) {
                hookCollection.delete(name);
            }

            // Remove config
            this.configs.delete(name);

            // Remove plugin
            this.items.delete(name);

            if (this.debug) {
                console.log(chalk.gray(`Unregistered plugin: ${name}`));
            }

            return true;

        } catch (error) {
            console.error(chalk.red(`Error unregistering plugin ${name}:`), error);
            throw error;
        }
    }

    /**
     * Execute plugin hooks
     */
    async executeHook(hookName, ...args) {
        const hooks = this.hooks.get(hookName);
        if (!hooks) return;

        for (const [pluginName, hook] of hooks) {
            try {
                if (this.isDisabled(pluginName)) continue;
                await hook(...args);
            } catch (error) {
                console.error(chalk.red(`Error in plugin ${pluginName} ${hookName}:`), error);
            }
        }
    }

    /**
     * Update plugin config
     */
    updateConfig(name, config) {
        const plugin = this.get(name);
        if (!plugin) return false;

        // Merge configs
        plugin.config = {
            ...plugin.config,
            ...config
        };

        // Store updated config
        this.configs.set(name, plugin.config);

        // Notify plugin
        if (plugin.onConfigUpdate) {
            plugin.onConfigUpdate(plugin.config).catch(error => {
                console.error(chalk.red(`Error updating plugin ${name} config:`), error);
            });
        }

        return true;
    }

    /**
     * Reset plugin config
     */
    resetConfig(name) {
        const plugin = this.get(name);
        if (!plugin) return false;

        // Reset to default config
        plugin.config = { ...plugin.defaultConfig };
        this.configs.set(name, plugin.config);

        // Notify plugin
        if (plugin.onConfigUpdate) {
            plugin.onConfigUpdate(plugin.config).catch(error => {
                console.error(chalk.red(`Error resetting plugin ${name} config:`), error);
            });
        }

        return true;
    }

    /**
     * Get plugin config
     */
    getConfig(name) {
        return this.configs.get(name);
    }

    /**
     * Clear all plugins
     */
    async clear() {
        // Unload all plugins
        for (const [name] of this.items) {
            await this.unregister(name);
        }

        // Clear collections
        this.items.clear();
        this.configs.clear();
        this.hooks.clear();
        this.disabled.clear();

        // Reinitialize hooks
        this.initHooks();

        return true;
    }

    /**
     * Get manager stats
     */
    getStats() {
        return {
            ...super.getStats(),
            hooks: Array.from(this.hooks.entries()).reduce((acc, [name, hooks]) => {
                acc[name] = hooks.size;
                return acc;
            }, {})
        };
    }

    /**
     * Get plugin info
     */
    getPluginInfo(name) {
        const plugin = this.get(name);
        if (!plugin) return null;

        return {
            name: plugin.name,
            version: plugin.version || '1.0.0',
            description: plugin.description,
            author: plugin.author,
            enabled: !this.isDisabled(plugin.name),
            hooks: Array.from(this.hooks.keys())
                .filter(hook => plugin[hook]),
            config: this.getConfig(plugin.name)
        };
    }
}

module.exports = PluginManager;
