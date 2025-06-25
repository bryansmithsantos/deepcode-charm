const { detectTier } = require('./detector');

/**
 * Parse command code into AST (Abstract Syntax Tree)
 */
function parseCommand(code, tier = 0) {
    if (!code) throw new Error('No command code provided');

    // Extract command name and arguments
    const match = code.match(/^\$(\w+)\[(.*)\]$/);
    if (!match) {
        throw new Error('Invalid command format. Expected: $command[arguments]');
    }

    const [, name, args] = match;

    // Parse based on tier
    let parsedArgs;
    switch (tier) {
        case 1: // Simple arguments
            parsedArgs = parseSimpleArgs(args);
            break;
        case 2: // Key-value pairs
            parsedArgs = parseKeyValueArgs(args);
            break;
        case 3: // JSON format
            parsedArgs = parseJsonArgs(args);
            break;
        default:
            // Auto-detect tier if not specified
            const detectedTier = detectTier(code);
            return parseCommand(code, detectedTier);
    }

    return {
        type: 'command',
        name,
        args: parsedArgs,
        tier
    };
}

/**
 * Parse simple comma/semicolon separated arguments
 */
function parseSimpleArgs(args) {
    if (!args) return [];
    return args.split(/[,;]/).map(arg => arg.trim());
}

/**
 * Parse key-value pairs
 * format: key: value; key2: value2
 */
function parseKeyValueArgs(args) {
    if (!args) return {};
    const pairs = args.split(';').map(pair => pair.trim());
    
    const result = {};
    for (const pair of pairs) {
        if (!pair) continue;
        
        const [key, ...valueParts] = pair.split(':');
        if (!key) continue;

        result[key.trim()] = valueParts.join(':').trim();
    }

    return result;
}

/**
 * Parse JSON format arguments
 */
function parseJsonArgs(args) {
    if (!args) return {};

    try {
        return JSON.parse(args);
    } catch (error) {
        throw new Error(`Invalid JSON format: ${error.message}`);
    }
}

/**
 * Format AST back into command string
 */
function formatCommand(ast) {
    if (!ast || !ast.name) {
        throw new Error('Invalid AST structure');
    }

    let args;
    switch (ast.tier) {
        case 1:
            args = Array.isArray(ast.args) ? ast.args.join(';') : ast.args;
            break;
        case 2:
            args = Object.entries(ast.args)
                .map(([key, value]) => `${key}: ${value}`)
                .join(';');
            break;
        case 3:
            args = JSON.stringify(ast.args);
            break;
        default:
            args = ast.args?.toString() || '';
    }

    return `$${ast.name}[${args}]`;
}

module.exports = {
    parseCommand,
    parseSimpleArgs,
    parseKeyValueArgs,
    parseJsonArgs,
    formatCommand
};
