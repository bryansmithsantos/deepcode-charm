/**
 * DeepCode Charm Framework Core
 */

// Core components
const CommandManager = require('./CommandManager');
const EventManager = require('./EventManager');
const VariableManager = require('./VariableManager');
const CharmEngine = require('./engine');
const CharmContext = require('./context');
const CharmClient = require('../runtime/CharmClient');

// Base error class
class CharmError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'CharmError';
        this.code = code;
        this.details = details;
    }
}

// Error collection
const errors = {
    CharmError,
    
    CommandError: class extends CharmError {
        constructor(message, details) {
            super(message, 'COMMAND_ERROR', details);
            this.name = 'CommandError';
        }
    },
    
    EventError: class extends CharmError {
        constructor(message, details) {
            super(message, 'EVENT_ERROR', details);
            this.name = 'EventError';
        }
    },
    
    ParseError: class extends CharmError {
        constructor(message, details) {
            super(message, 'PARSE_ERROR', details);
            this.name = 'ParseError';
        }
    },
    
    ValidationError: class extends CharmError {
        constructor(message, details) {
            super(message, 'VALIDATION_ERROR', details);
            this.name = 'ValidationError';
        }
    }
};

// Core constructors
module.exports = {
    // Client & Engine
    CharmClient,
    CharmEngine,
    CharmContext,

    // Managers
    CommandManager,
    EventManager,
    VariableManager,

    // Error handling
    CharmError,

    // Factory method
    create(options = {}) {
        return new CharmClient(options);
    }
};
