/**
 * DeepCode Charm Framework
 * A powerful Discord bot framework with multi-tier syntax support
 */

const core = require('./core');

// Export the full API
const deepcodeExports = {
    // Core constructors
    CharmClient: core.CharmClient,
    CharmEngine: core.CharmEngine,
    CharmContext: core.CharmContext,
    CharmExecutor: core.CharmExecutor,
    CharmLoader: core.CharmLoader,

    // Managers
    CommandManager: core.CommandManager,
    EventManager: core.EventManager,
    PluginManager: core.PluginManager,
    VariableManager: core.VariableManager,

    // Error handling
    CharmError: core.CharmError,

    // Utilities
    utils: core.utils,
    
    // Version info
    version: core.version,
    
    // Factory methods
    create(options = {}) {
        return core.create(options);
    },

    /**
     * Create and start a new bot instance
     */
    async start(options = {}) {
        const client = core.create(options);
        await client.start();
        return client;
    },

    /**
     * Parse config file
     */
    loadConfig(path) {
        try {
            return require(path);
        } catch (error) {
            throw new core.CharmError(`Failed to load config: ${error.message}`, 'CONFIG_ERROR');
        }
    }
};

// CommonJS export
module.exports = deepcodeExports;

// ES Module export
module.exports.default = deepcodeExports;
module.exports.CharmClient = deepcodeExports.CharmClient;
module.exports.CharmEngine = deepcodeExports.CharmEngine;
module.exports.CharmContext = deepcodeExports.CharmContext;
module.exports.CharmExecutor = deepcodeExports.CharmExecutor;
