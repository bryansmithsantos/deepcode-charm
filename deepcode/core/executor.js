const { Collection } = require('discord.js');
const { errors } = require('./index');
const chalk = require('chalk');

/**
 * Command execution handler
 */
class Executor {
    constructor(client) {
        this.client = client;
        this.cooldowns = new Collection();
        this.executing = new Collection();
        this.debug = client.debug || false;
    }

    /**
     * Execute a command
     */
    async execute(command, context) {
        try {
            // Validate command
            if (!this.validateCommand(command, context)) {
                return false;
            }

            // Check cooldowns
            if (!this.checkCooldown(command, context)) {
                return false;
            }

            // Check permissions
            if (!await this.checkPermissions(command, context)) {
                return false;
            }

            // Pre-execution hooks
            await this.runPreExecutionHooks(command, context);

            // Start tracking execution
            this.startExecution(command, context);

            // Execute command
            const result = await this.executeCommand(command, context);

            // Post-execution hooks
            await this.runPostExecutionHooks(command, context, result);

            // Update stats
            this.updateStats(command, context);

            return result;

        } catch (error) {
            await this.handleError(error, command, context);
            return false;
        }
    }

    /**
     * Validate command can be executed
     */
    validateCommand(command, context) {
        // Check if command exists
        if (!command) {
            throw new errors.CommandError('Command not found');
        }

        // Check if command is disabled
        if (command.disabled) {
            throw new errors.CommandError('This command is disabled');
        }

        // Check if command is already executing
        if (this.executing.has(context.author.id)) {
            throw new errors.CommandError('You already have a command executing');
        }

        // Check guild only
        if (command.guildOnly && !context.guild) {
            throw new errors.CommandError('This command can only be used in a server');
        }

        // Check DM only
        if (command.dmOnly && context.guild) {
            throw new errors.CommandError('This command can only be used in DMs');
        }

        // Check owner only
        if (command.ownerOnly && !this.isOwner(context.author)) {
            throw new errors.CommandError('This command can only be used by the bot owner');
        }

        return true;
    }

    /**
     * Check command cooldown
     */
    checkCooldown(command, context) {
        if (!command.cooldown) return true;

        const cooldownTime = this.parseCooldown(command.cooldown);
        const key = `${command.name}:${context.author.id}`;
        const cooldown = this.cooldowns.get(key);

        if (cooldown) {
            const remaining = cooldownTime - (Date.now() - cooldown);
            if (remaining > 0) {
                const time = this.formatCooldown(remaining);
                throw new errors.CommandError(`Please wait ${time} before using this command again`);
            }
        }

        this.cooldowns.set(key, Date.now());
        return true;
    }

    /**
     * Check command permissions
     */
    async checkPermissions(command, context) {
        // No permissions needed
        if (!command.permissions?.length) return true;

        // Check bot permissions
        const botMember = await context.guild?.members.fetch(this.client.user.id);
        if (!botMember) return true;

        const missingBot = command.permissions.filter(perm => !botMember.permissions.has(perm));
        if (missingBot.length) {
            throw new errors.CommandError(`I need the following permissions: ${missingBot.join(', ')}`);
        }

        // Check user permissions
        const member = await context.guild?.members.fetch(context.author.id);
        if (!member) return true;

        const missingUser = command.permissions.filter(perm => !member.permissions.has(perm));
        if (missingUser.length) {
            throw new errors.CommandError(`You need the following permissions: ${missingUser.join(', ')}`);
        }

        return true;
    }

    /**
     * Run pre-execution hooks
     */
    async runPreExecutionHooks(command, context) {
        // Plugin pre-execution hooks
        for (const plugin of this.client.plugins.values()) {
            if (plugin.onCommandPre) {
                await plugin.onCommandPre(command, context);
            }
        }
    }

    /**
     * Run post-execution hooks
     */
    async runPostExecutionHooks(command, context, result) {
        // Plugin post-execution hooks
        for (const plugin of this.client.plugins.values()) {
            if (plugin.onCommandPost) {
                await plugin.onCommandPost(command, context, result);
            }
        }
    }

    /**
     * Start tracking command execution
     */
    startExecution(command, context) {
        this.executing.set(context.author.id, {
            command: command.name,
            started: Date.now()
        });
    }

    /**
     * Execute the command
     */
    async executeCommand(command, context) {
        try {
            if (this.debug) {
                console.log(chalk.blue(`\nExecuting command: ${command.name}`));
                console.log(chalk.gray('Arguments:', context.args.join(' ')));
            }

            // Parse command code
            const code = command.code || command.execute;
            if (typeof code === 'string') {
                // Execute string command code
                return await this.client.engine.process(code, context);
            } else if (typeof code === 'function') {
                // Execute function command code
                return await code.call(command, context);
            } else {
                throw new errors.CommandError('Invalid command code');
            }

        } catch (error) {
            throw error;

        } finally {
            this.executing.delete(context.author.id);
        }
    }

    /**
     * Handle command error
     */
    async handleError(error, command, context) {
        // Log error
        console.error(chalk.red(`Error in command ${command?.name}:`), error);

        // Send error message
        const errorMessage = this.debug ? error.stack : error.message;
        await context.reply({
            content: `❌ ${errorMessage}`,
            ephemeral: true
        }).catch(() => null);

        // Plugin error hooks
        for (const plugin of this.client.plugins.values()) {
            if (plugin.onCommandError) {
                await plugin.onCommandError(error, command, context);
            }
        }

        // Clear executing state
        this.executing.delete(context.author.id);
    }

    /**
     * Update command statistics
     */
    updateStats(command, context) {
        // Update command count
        this.client.variables.stats = this.client.variables.stats || {};
        this.client.variables.stats.commands = (this.client.variables.stats.commands || 0) + 1;

        // Update command specific stats
        const commandStats = this.client.variables.commands?.[command.name] || {};
        commandStats.uses = (commandStats.uses || 0) + 1;
        commandStats.lastUse = Date.now();
        commandStats.lastUser = context.author.id;

        this.client.variables.commands = {
            ...this.client.variables.commands,
            [command.name]: commandStats
        };
    }

    /**
     * Parse cooldown string to milliseconds
     */
    parseCooldown(cooldown) {
        const units = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000
        };

        if (typeof cooldown === 'number') {
            return cooldown;
        }

        const match = cooldown.match(/^(\d+)([smhd])$/);
        if (!match) return 3000; // Default 3s

        const [, num, unit] = match;
        return parseInt(num) * units[unit];
    }

    /**
     * Format cooldown time to string
     */
    formatCooldown(ms) {
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        const minutes = Math.ceil(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    /**
     * Check if user is bot owner
     */
    isOwner(user) {
        if (!user) return false;
        const owners = Array.isArray(this.client.config.owners)
            ? this.client.config.owners
            : [this.client.config.owners];
        return owners.includes(user.id);
    }
}

module.exports = Executor;
