/**
 * Base class for all Charms.
 * Provides a common structure for argument parsing, validation, and execution.
 */
class BaseCharm {
    constructor(client) {
        if (!client) {
            throw new Error('A client instance must be provided to the charm.');
        }
        this.client = client;
    }

    /**
     * The main execution method for the charm.
     * Subclasses must implement this method.
     * @param {any} args - The arguments provided to the charm.
     * @param {object} context - The context of the command execution (message, author, etc.).
     */
    async execute(args, context) {
        throw new Error(`The charm ${this.constructor.name} must implement an execute() method.`);
    }

    /**
     * Parses the arguments, detects the syntax tier, and normalizes the output.
     * This is a placeholder for the future tiered syntax system.
     * @param {any} args - The raw arguments.
     * @returns {object} The parsed and normalized options.
     */
    parse(args) {
        // Tier 1: Simple string
        if (typeof args === 'string') {
            return { content: args };
        }

        // Tier 2 & 3: Object (for now, we treat them the same)
        if (typeof args === 'object' && args !== null) {
            return args;
        }

        // Default case
        return { content: '' };
    }

     /**
     * Sends a reply to the original message.
     * @param {object} context - The execution context.
     * @param {string|object} options - The message content or discord.js message options.
     */
    async reply(context, options) {
        if (!context || !context.send) {
            console.error('Invalid context provided for reply.');
            return;
        }
        return context.send(options);
    }
}

module.exports = BaseCharm; 