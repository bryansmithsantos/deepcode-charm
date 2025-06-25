const { detectTier } = require('./detector');

/**
 * Validate command structure
 */
function validateCommand(ast, tier = 0) {
    if (!ast) {
        throw new Error('No AST provided');
    }

    // Validate command name
    if (!ast.name || typeof ast.name !== 'string') {
        throw new Error('Command must have a valid name');
    }

    // If no tier specified, detect it
    if (!tier) {
        tier = detectTier(`$${ast.name}[${JSON.stringify(ast.args)}]`);
    }

    // Validate arguments based on tier
    validateTierArguments(ast.args, tier);

    return true;
}

/**
 * Validate arguments for specific tier
 */
function validateTierArguments(args, tier) {
    switch (tier) {
        case 1:
            validateSimpleArgs(args);
            break;
        case 2:
            validateKeyValueArgs(args);
            break;
        case 3:
            validateJsonArgs(args);
            break;
        default:
            throw new Error(`Invalid tier: ${tier}`);
    }
}

/**
 * Validate simple arguments
 */
function validateSimpleArgs(args) {
    if (!args) return; // Empty args allowed

    if (!Array.isArray(args) && typeof args !== 'string') {
        throw new Error('Simple arguments must be an array or string');
    }

    if (Array.isArray(args)) {
        args.forEach((arg, index) => {
            if (typeof arg !== 'string') {
                throw new Error(`Argument at index ${index} must be a string`);
            }
        });
    }
}

/**
 * Validate key-value arguments
 */
function validateKeyValueArgs(args) {
    if (!args) return; // Empty args allowed

    if (typeof args !== 'object' || Array.isArray(args)) {
        throw new Error('Key-value arguments must be an object');
    }

    // Check each key-value pair
    Object.entries(args).forEach(([key, value]) => {
        if (typeof key !== 'string') {
            throw new Error('Keys must be strings');
        }

        // Value can be string, number, or boolean
        const validTypes = ['string', 'number', 'boolean'];
        if (!validTypes.includes(typeof value)) {
            throw new Error(`Invalid value type for key "${key}": ${typeof value}`);
        }
    });
}

/**
 * Validate JSON arguments
 */
function validateJsonArgs(args) {
    if (!args) return; // Empty args allowed

    try {
        // Test if can be stringified/parsed
        const jsonStr = JSON.stringify(args);
        JSON.parse(jsonStr);

        // Check for circular references
        detectCircular(args);

    } catch (error) {
        throw new Error(`Invalid JSON format: ${error.message}`);
    }
}

/**
 * Detect circular references
 */
function detectCircular(obj, seen = new Set()) {
    if (!obj || typeof obj !== 'object') return;

    if (seen.has(obj)) {
        throw new Error('Circular reference detected');
    }

    seen.add(obj);

    Object.values(obj).forEach(value => {
        detectCircular(value, new Set(seen));
    });
}

/**
 * Validate variable usage
 */
function validateVariables(code, variables) {
    if (!code) return [];

    const varPattern = /\$\$(\w+(\.\w+)*)/g;
    const matches = code.match(varPattern) || [];
    const missing = [];

    matches.forEach(match => {
        const varPath = match.slice(2); // Remove $$
        const parts = varPath.split('.');
        let value = variables.get(parts[0]);

        // Check nested properties
        for (let i = 1; value !== undefined && i < parts.length; i++) {
            value = value[parts[i]];
        }

        if (value === undefined) {
            missing.push(varPath);
        }
    });

    return missing;
}

module.exports = {
    validateCommand,
    validateTierArguments,
    validateSimpleArgs,
    validateKeyValueArgs,
    validateJsonArgs,
    validateVariables
};
