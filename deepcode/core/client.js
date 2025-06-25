const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const CommandManager = require('./CommandManager');
const EventManager = require('./EventManager');
const VariableManager = require('./VariableManager');
const CharmEngine = require('./engine');
const CharmLoader = require('./Loader');
const chalk = require('chalk');

/**
 * Custom Discord client with Charm features
 */
class CharmClient extends Client {
    constructor(options = {}) {
        // Set default intents
        const intents = options.intents || [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildMessageReactions
        ];

        // Set default partials
        const partials = options.partials || [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ];

        super({ intents, partials });

        // Client options
        this.debug = options.debug || false;
        this.prefix = options.prefix || process.env.PREFIX || '!';
        this.token = options.token || process.env.DISCORD_TOKEN;
        this.config = options.config || {};

        // Initialize collections
        this.commands = new CommandManager(this);
        this.events = new EventManager(this);
        this.charms = new Collection();
        this.variables = new VariableManager(this);

        // Initialize systems
        this.engine = new CharmEngine(this);
        this.loader = new CharmLoader(this);

        // Add error handlers
        this.initErrorHandlers();

        // Add debug logging
        if (this.debug) {
            this.on('debug', message => {
                console.log(chalk.gray('Discord Debug:', message));
            });
        }
    }

    /**
     * Initialize error handlers
     */
    initErrorHandlers() {
        // Handle process errors
        process.on('unhandledRejection', error => {
            console.error(chalk.red('Unhandled Rejection:'), error);
            this.emit('error', error);
        });

        process.on('uncaughtException', error => {
            console.error(chalk.red('Uncaught Exception:'), error);
            this.emit('error', error);
            process.exit(1);
        });

        // Handle client errors
        this.on('error', error => {
            console.error(chalk.red('Client Error:'), error);
        });

        this.on('shardError', (error, shardId) => {
            console.error(chalk.red(`Shard ${shardId} Error:`), error);
        });

        this.on('warn', warning => {
            console.warn(chalk.yellow('Client Warning:'), warning);
        });
    }

    /**
     * Start the bot
     */
    async start(token = this.token) {
        try {
            if (!token) {
                throw new Error('No token provided');
            }

            console.log(chalk.blue('\nStarting bot...'));

            // Load variables if persistence enabled
            if (this.config.variables?.persist) {
                await this.variables.load();
            }

            // Load components
            await this.loader.loadAll();

            // Login to Discord
            await this.login(token);

            // Print bot info on ready
            this.once('ready', () => {
                console.log(chalk.green('\n✓ Bot is ready!'));
                console.log(chalk.gray(`   Logged in as: ${this.user.tag}`));
                console.log(chalk.gray(`   Prefix: ${this.prefix}`));
                console.log(chalk.gray(`   Debug: ${this.debug}`));
                console.log();
            });

        } catch (error) {
            console.error(chalk.red('\nFailed to start bot:'), error);
            throw error;
        }
    }

    /**
     * Stop the bot
     */
    async stop() {
        try {
            console.log(chalk.blue('\nStopping bot...'));

            // Save variables if persistence enabled
            if (this.config.variables?.persist) {
                await this.variables.save();
            }

            // Destroy client
            this.destroy();

            console.log(chalk.green('✓ Bot stopped'));

        } catch (error) {
            console.error(chalk.red('Error stopping bot:'), error);
            throw error;
        }
    }

    /**
     * Restart the bot
     */
    async restart() {
        try {
            console.log(chalk.blue('\nRestarting bot...'));

            // Stop bot
            await this.stop();

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start bot
            await this.start();

            console.log(chalk.green('✓ Bot restarted'));

        } catch (error) {
            console.error(chalk.red('Error restarting bot:'), error);
            throw error;
        }
    }

    /**
     * Set bot status
     */
    setStatus(options = {}) {
        const { type = 'PLAYING', name, url } = options;

        this.user?.setActivity(name, { 
            type, 
            url 
        });
    }
}

module.exports = CharmClient;
