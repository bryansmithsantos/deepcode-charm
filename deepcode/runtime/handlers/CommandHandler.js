const { Collection } = require('discord.js');
const { errors, Context } = require('../../core');
const chalk = require('chalk');

/**
 * Command handler class
 */
class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
        this.disabled = new Set();
        this.debug = client.debug || false;

        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);

        // Add message listener
        this.initMessageHandler();
    }

    /**
     * Initialize message handler
     */
    initMessageHandler() {
        this.client.on('messageCreate', this.handleMessage);
    }

    /**
     * Register a command
     */
    register(command) {
        try {
            // Validate command
            if (!command.name) {
                throw new errors.CommandError('Command must have a name');
            }

            if (!command.code && !command.execute && !command.run) {
                throw new errors.CommandError('Command must have code, execute, or run method');
            }

            // Add execute method if using run
            if (!command.execute) {
                command.execute = command.run;
            }

            // Add command to collection
            this.commands.set(command.name, command);

            // Add aliases
            if (command.aliases?.length) {
                for (const alias of command.aliases) {
                    this.aliases.set(alias, command.name);
                }
            }

            if (this.debug) {
                console.log(chalk.gray(`Registered command: ${command.name}`));
            }

        } catch (error) {
            console.error(chalk.red(`Error registering command ${command.name}:`), error);
            throw error;
        }
    }

    /**
     * Unregister a command
     */
    unregister(name) {
        try {
            // Get command
            const command = this.getCommand(name);
            if (!command) return false;

            // Remove aliases
            if (command.aliases?.length) {
                for (const alias of command.aliases) {
                    this.aliases.delete(alias);
                }
            }

            // Remove command
            this.commands.delete(command.name);

            if (this.debug) {
                console.log(chalk.gray(`Unregistered command: ${name}`));
            }

            return true;

        } catch (error) {
            console.error(chalk.red(`Error unregistering command ${name}:`), error);
            throw error;
        }
    }

    /**
     * Get a command by name or alias
     */
    getCommand(name) {
        return this.commands.get(name) || this.commands.get(this.aliases.get(name));
    }

    /**
     * Handle a message
     */
    async handleMessage(message) {
        try {
            // Ignore bots
            if (message.author.bot) return;

            // Check for prefix
            const prefix = this.client.prefix;
            if (!message.content.startsWith(prefix)) return;

            // Parse command and args
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();

            if (!commandName) return;

            // Get command
            const command = this.getCommand(commandName);
            if (!command) return;

            // Check if disabled
            if (this.isDisabled(command.name)) {
                throw new errors.CommandError('This command is disabled');
            }

            // Create context
            const context = new Context(this.client, message, command, args);

            // Execute command
            await this.executeCommand(command, context);

        } catch (error) {
            await this.handleError(error, message);
        }
    }

    /**
     * Execute a command
     */
    async executeCommand(command, context) {
        try {
            // Start performance timer
            const start = process.hrtime();

            // Plugin pre-execute hooks
            await this.runPreHooks(command, context);

            // Execute command
            const result = await this.client.executor.execute(command, context);

            // Plugin post-execute hooks
            await this.runPostHooks(command, context, result);

            // Performance tracking
            if (this.debug) {
                const [seconds, nanoseconds] = process.hrtime(start);
                const duration = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
                console.log(chalk.gray(`Command ${command.name} executed in ${duration}ms`));
            }

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Run pre-execution hooks
     */
    async runPreHooks(command, context) {
        for (const plugin of this.client.plugins.values()) {
            if (plugin.onCommandPre) {
                await plugin.onCommandPre(command, context);
            }
        }
    }

    /**
     * Run post-execution hooks
     */
    async runPostHooks(command, context, result) {
        for (const plugin of this.client.plugins.values()) {
            if (plugin.onCommandPost) {
                await plugin.onCommandPost(command, context, result);
            }
        }
    }

    /**
     * Handle command error
     */
    async handleError(error, message) {
        // Log error
        console.error(chalk.red('Command Error:'), error);

        // Send error message
        const errorMessage = this.debug ? error.stack : error.message;
        await message.reply({
            content: `❌ ${errorMessage}`,
            ephemeral: true
        }).catch(() => null);

        // Emit error event
        this.client.emit('commandError', error, message);
    }

    /**
     * Enable a command
     */
    enable(name) {
        this.disabled.delete(name);
    }

    /**
     * Disable a command
     */
    disable(name) {
        this.disabled.add(name);
    }

    /**
     * Check if command is disabled
     */
    isDisabled(name) {
        return this.disabled.has(name);
    }

    /**
     * Get all command names
     */
    getCommandNames() {
        return [...this.commands.keys()];
    }

    /**
     * Get command aliases
     */
    getAliases(name) {
        const command = this.getCommand(name);
        return command?.aliases || [];
    }

    /**
     * Clear all commands
     */
    clear() {
        this.commands.clear();
        this.aliases.clear();
        this.cooldowns.clear();
        this.disabled.clear();
    }

    /**
     * Get command stats
     */
    getStats() {
        return {
            total: this.commands.size,
            disabled: this.disabled.size,
            enabled: this.commands.size - this.disabled.size,
            aliases: this.aliases.size
        };
    }
}

module.exports = CommandHandler;
