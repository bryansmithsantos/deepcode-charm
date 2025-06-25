/**
 * CharmClient - Enhanced Discord.js client with charm support
 * @module runtime/CharmClient
 */
const { Client, Collection } = require('discord.js');
const CommandManager = require('../core/CommandManager');
const EventManager = require('../core/EventManager');
const CharmEvents = require('../core/CharmEvents');
const PluginManager = require('../core/PluginManager');
const VariableManager = require('../core/VariableManager');
const Engine = require('../core/engine');
const CharmCommandLoader = require('../core/CharmCommandLoader');
const Loader = require('../core/Loader');

class CharmClient extends Client {
    constructor(options = {}) {
        super(options);

        // Core systems
        this.commands = new CommandManager(this);
        this.events = new EventManager(this);
        this.charmEvents = new CharmEvents(this);
        this.plugins = new PluginManager(this);
        this.variables = new VariableManager(this);
        this.engine = new Engine(this);
        this.charms = new Collection();
        this.loader = new Loader(this);

        // CharmCommandLoader for automatic command loading
        this.CharmCommander = (commandsDir = 'commands') => {
            return this._charmCommandLoader.loadCommands(commandsDir);
        };

        // Store the actual loader instance
        this._charmCommandLoader = new CharmCommandLoader(this);

        // Add methods to CharmCommander for advanced usage
        this.CharmCommander.loadCommands = (dir) => this._charmCommandLoader.loadCommands(dir);
        this.CharmCommander.reloadCommand = (name) => this._charmCommandLoader.reloadCommand(name);
        this.CharmCommander.getLoadedCommandsInfo = () => this._charmCommandLoader.getLoadedCommandsInfo();

        // Configuration
        this.prefix = options.prefix || '!';
        this.debug = options.debug || false;
        this.config = this.processConfig(options.config || {});

        // Initialize systems (sync part only)
        this.initSync();
    }

    /**
     * Process and simplify configuration
     * @private
     */
    processConfig(config) {
        const processed = { ...config };

        // Simplify status configuration
        if (config.status) {
            if (Array.isArray(config.status)) {
                // Format: status: ['text', 'type'] or status: ['text', 'type', 'status']
                processed.status = {
                    text: config.status[0] || 'commands',
                    type: config.status[1] || 'WATCHING',
                    status: config.status[2] || 'online'
                };
            } else if (typeof config.status === 'string') {
                // Format: status: 'text'
                processed.status = {
                    text: config.status,
                    type: 'WATCHING',
                    status: 'online'
                };
            }
            // If it's already an object, keep it as is
        }

        return processed;
    }

    /**
     * Initialize synchronous systems
     * @private
     */
    initSync() {
        // Load error handler
        this.on('error', error => {
            console.error('Client Error:', error);
        });

        // Load core event handlers
        this.loadCoreEvents();

        // Initialize charm event handlers
        this.initCharmEvents();
    }

    /**
     * Initialize asynchronous systems
     * @private
     */
    async initAsync() {
        // Load charms automatically
        await this.loadCharms();
    }

    /**
     * Load core event handlers
     * @private
     */
    loadCoreEvents() {
        try {
            // Load messageCreate handler
            const messageCreateHandler = require('../events/messageCreate');
            this.on('messageCreate', (message) => messageCreateHandler.execute(message, this));

            // Load ready handler
            const readyHandler = require('../events/ready');
            this.on('ready', () => readyHandler.execute(this));

            // Load error handler
            const errorHandler = require('../events/error');
            this.on('error', (error) => errorHandler.execute(error, this));

        } catch (error) {
            console.error('Error loading core events:', error);
        }
    }

    /**
     * Load charms automatically
     * @private
     */
    async loadCharms() {
        try {
            await this.loader.loadCharms();
        } catch (error) {
            console.error('Error loading charms:', error);
        }
    }

    /**
     * Initialize charm event handlers with simplified syntax
     * @private
     */
    initCharmEvents() {
        // Python-like decorator syntax support
        this.OnReady = (handler) => {
            this.charmEvents.on('OnReady', handler);
            return handler;
        };

        this.OnMessage = (handler) => {
            this.charmEvents.on('OnMessage', handler);
            return handler;
        };

        // Add all other event handlers
        Object.keys(this.charmEvents.eventMap).forEach(eventName => {
            if (!this[eventName]) {
                this[eventName] = (handler) => {
                    this.charmEvents.on(eventName, handler);
                    return handler;
                };
            }
        });
    }

    /**
     * Start the bot
     * @param {string} token Bot token
     * @returns {Promise<string>} Login confirmation
     */
    async start(token) {
        // Apply status if configured
        if (this.config.status) {
            this.once('ready', () => {
                this.user.setPresence({
                    activities: [{
                        name: this.config.status.text,
                        type: this.config.status.type
                    }],
                    status: this.config.status.status
                });
            });
        }

        // Load plugins before starting
        if (this.config.plugins) {
            for (const [name, options] of Object.entries(this.config.plugins)) {
                if (options.enabled) {
                    await this.plugins.load(name, options.config);
                }
            }
        }

        // Load variables if persistence is enabled
        if (this.config.variables?.persist) {
            await this.variables.load();
        }

        // Login to Discord
        return this.login(token);
    }

    /**
     * Login to Discord with charm loading
     * @param {string} token Bot token
     * @returns {Promise<string>} Login confirmation
     */
    async login(token) {
        // Load charms before login
        await this.initAsync();

        // Call parent login method
        return super.login(token);
    }

    /**
     * Stop the bot
     */
    async stop() {
        // Save variables if persistence is enabled
        if (this.config.variables?.persist) {
            await this.variables.save();
        }

        // Unload all plugins
        await this.plugins.unloadAll();

        // Destroy client
        this.destroy();
    }

    /**
     * Execute charm code
     * @param {string} code Charm code to execute
     * @param {Object} context Execution context
     * @returns {Promise<any>} Execution result
     */
    async executeCharm(code, context = {}) {
        return this.engine.execute(code, context);
    }

    /**
     * Register a Python-style event handler
     * @param {string} event Event name
     * @param {Function} handler Event handler
     * @example
     * @bot.CharmsEvents('OnReady')
     * async def ready():
     *     print('Bot is ready!')
     */
    CharmsEvents(event) {
        return (handler) => {
            this.charmEvents.on(event, handler);
            return handler;
        };
    }

    /**
     * Easy command registration method
     * @param {Object} options Command options
     * @returns {Object} Registered command
     * @example
     * client.CharmRegisterCommand({
     *     name: 'hello',
     *     description: 'Say hello',
     *     code: `$say[Hello World!]`
     * });
     */
    CharmRegisterCommand(options) {
        if (!options || !options.name) {
            throw new Error('Command must have a name');
        }

        // Default values for easier usage
        const command = {
            name: options.name,
            description: options.description || 'No description provided',
            usage: options.usage || '',
            aliases: options.aliases || [],
            category: options.category || 'General',
            cooldown: options.cooldown || 0,
            permissions: options.permissions || [],
            tier: options.tier || 1,
            code: options.code || options.execute || options.run || `$say[Command ${options.name} executed!]`,
            ...options
        };

        // Register the command
        this.commands.register(command);

        if (this.debug) {
            console.log(`✓ CharmRegisterCommand: ${command.name} registered successfully`);
        }

        return command;
    }
}

module.exports = CharmClient;
