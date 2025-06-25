const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { CharmEngine } = require('../core/engine');
const CommandManager = require('../core/CommandManager');
const EventManager = require('../core/EventManager');
const PluginManager = require('../core/PluginManager');
const VariableManager = require('../core/VariableManager');
const CharmLoader = require('../core/Loader');
const chalk = require('chalk');

class CharmClient extends Client {
    constructor(options = {}) {
        // Parse intents
        const intents = options.intents?.map(intent => 
            GatewayIntentBits[intent] || intent
        ) || [
            // Default required intents
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ];

        // Parse partials
        const partials = options.partials?.map(partial =>
            Partials[partial] || partial
        ) || [
            // Default required partials
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ];

        super({ intents, partials });

        // Client options
        this.token = options.token || process.env.DISCORD_TOKEN;
        this.prefix = options.prefix || process.env.PREFIX || '!';
        this.debug = options.debug || false;
        this.config = options.config || {};

        // Initialize managers
        this.commands = new CommandManager(this);
        this.events = new EventManager(this);
        this.plugins = new PluginManager(this);
        this.variables = new VariableManager(this);
        this.engine = new CharmEngine(this);
        this.loader = new CharmLoader(this);
        this.charms = new Collection();

        // Initialize custom collections
        this.cooldowns = new Collection();
        this.aliases = new Collection();
        this.tasks = new Collection();

        // Error handling
        this.initErrorHandlers();

        // Debug logging
        if (this.debug) {
            this.on('debug', message => {
                console.log(chalk.gray('Debug:'), message);
            });
        }
    }

    /**
     * Start the bot
     */
    async start(token = this.token) {
        try {
            console.log(chalk.blue('\nStarting bot...'));

            // Validate token
            if (!token) {
                throw new Error('No token provided. Set DISCORD_TOKEN env variable or pass token in options.');
            }

            // Load components
            await this.loader.loadAll().catch(error => {
                console.error(chalk.red('Failed to load components:'), error);
                throw error;
            });

            // Login to Discord
            await this.login(token).catch(error => {
                console.error(chalk.red('Failed to login:'), error);
                throw error;
            });

            // Success
            console.log(chalk.green('\n✓ Bot started successfully'));
            console.log(chalk.gray(`  Logged in as: ${this.user.tag}`));
            console.log(chalk.gray(`  Prefix: ${this.prefix}`));
            console.log(chalk.gray(`  Debug: ${this.debug}`));
            console.log();

        } catch (error) {
            console.error(chalk.red('\nFailed to start bot:'), error);
            process.exit(1);
        }
    }

    /**
     * Initialize error handlers
     */
    initErrorHandlers() {
        // Process errors
        process.on('unhandledRejection', error => {
            console.error(chalk.red('Unhandled Rejection:'), error);
            this.emit('error', error);
        });

        process.on('uncaughtException', error => {
            console.error(chalk.red('Uncaught Exception:'), error);
            this.emit('error', error);
            process.exit(1);
        });

        // Discord.js errors
        this.on('error', error => {
            console.error(chalk.red('Client Error:'), error);
            // Emit to error event handler
            this.events.emit('error', error);
        });

        this.on('warn', warning => {
            console.warn(chalk.yellow('Client Warning:'), warning);
        });

        this.on('rateLimit', rateLimitData => {
            if (this.debug) {
                console.warn(chalk.yellow('Rate Limited:'), rateLimitData);
            }
        });

        this.on('invalidated', () => {
            console.error(chalk.red('Session Invalidated'));
            process.exit(0);
        });
    }

    /**
     * Get bot stats
     */
    getStats() {
        return {
            guilds: this.guilds.cache.size,
            users: this.users.cache.size,
            channels: this.channels.cache.size,
            commands: this.commands.size,
            events: this.events.size,
            plugins: this.plugins.size,
            uptime: this.uptime,
            ping: this.ws.ping,
            memory: process.memoryUsage().heapUsed,
            version: process.version
        };
    }

    /**
     * Stop the bot
     */
    async stop(code = 0) {
        console.log(chalk.blue('\nStopping bot...'));

        try {
            // Save data
            if (this.variables.persist) {
                await this.variables.save();
            }

            // Destroy client
            this.destroy();

            console.log(chalk.green('✓ Bot stopped'));
            process.exit(code);

        } catch (error) {
            console.error(chalk.red('Error stopping bot:'), error);
            process.exit(1);
        }
    }
}

module.exports = CharmClient;
