const Handler = require('../runtime/handler');

class CommandManager extends Handler {
    constructor(client) {
        super(client, { type: 'command' });
    }

    /**
     * Validate the command structure.
     * Returns true if valid; otherwise, logs a warning and returns false.
     */
    validateCommand(command) {
        // Require errors from core index to break circular references (if needed)
        // const { errors } = require('./index');
        if (!command || !command.name) {
            console.warn('Skipping command registration: Command must have a name.');
            return false;
        }
        // Additional validations can be added here
        return true;
    }

    /**
     * Register a command.
     * If the command is undefined or invalid, log a warning and skip registration.
     */
    register(command) {
        if (!command) {
            console.warn('Warning: Tried to register an undefined command. Skipping.');
            return;
        }
        if (!this.validateCommand(command)) {
            // Invalid command; skipping registration.
            return;
        }
        try {
            super.register(command);
        } catch (error) {
            console.error(`Error registering command ${command.name || 'undefined'}:`, error);
            throw error;
        }
    }

    /**
     * Unregister a command by name
     * @param {string} commandName - Name of command to unregister
     */
    unregister(commandName) {
        if (super.unregister) {
            return super.unregister(commandName);
        }

        // Fallback implementation if parent doesn't have unregister
        if (this.commands && this.commands.delete) {
            const result = this.commands.delete(commandName);

            // Also remove from aliases if they exist
            if (this.aliases) {
                for (const [alias, name] of this.aliases.entries()) {
                    if (name === commandName) {
                        this.aliases.delete(alias);
                    }
                }
            }

            return result;
        }

        return false;
    }
}

module.exports = CommandManager;
