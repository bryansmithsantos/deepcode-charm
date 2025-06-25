/**
 * Command syntax tiers:
 * 1 - Simple arguments: $command[arg1, arg2]
 * 2 - Key-value pairs: $command[key: value; key2: value2]
 * 3 - JSON format: $command[{"key": "value"}]
 */

/**
 * Detect command syntax tier
 */
function detectTier(code) {
    if (!code) return 0;

    // Remove command name
    const match = code.match(/^\$\w+\[(.*)\]$/);
    if (!match) return 0;

    const args = match[1].trim();
    if (!args) return 1; // Empty args = tier 1

    // Check for JSON format (tier 3)
    if ((args.startsWith('{') && args.endsWith('}')) || 
        (args.startsWith('[') && args.endsWith(']'))) {
        try {
            JSON.parse(args);
            return 3;
        } catch {
            // Not valid JSON, continue checking
        }
    }

    // Check for key-value pairs (tier 2)
    const hasKeyValue = /\w+\s*:/.test(args);
    const hasSemicolon = args.includes(';');
    if (hasKeyValue || hasSemicolon) {
        return 2;
    }

    // Default to tier 1 (simple arguments)
    return 1;
}

/**
 * Get tier name
 */
function getTierName(tier) {
    switch (tier) {
        case 1: return 'Simple';
        case 2: return 'Key-Value';
        case 3: return 'JSON';
        default: return 'Unknown';
    }
}

/**
 * Get tier description
 */
function getTierDescription(tier) {
    switch (tier) {
        case 1:
            return 'Simple arguments separated by commas or semicolons';
        case 2:
            return 'Key-value pairs separated by semicolons';
        case 3:
            return 'JSON format for complex data structures';
        default:
            return 'Unknown tier';
    }
}

/**
 * Get tier example
 */
function getTierExample(tier) {
    switch (tier) {
        case 1:
            return '$command[arg1, arg2, arg3]';
        case 2:
            return '$command[key: value; key2: value2]';
        case 3:
            return '$command[{"key": "value", "embed": {"title": "Example"}}]';
        default:
            return 'Unknown tier';
    }
}

/**
 * Check if code matches tier
 */
function matchesTier(code, tier) {
    return detectTier(code) === tier;
}

/**
 * Get recommended tier for data
 */
function recommendTier(data) {
    // For objects or arrays with nested structures
    if (typeof data === 'object' && data !== null) {
        const json = JSON.stringify(data);
        if (json.includes('{') || json.includes('[')) {
            return 3;
        }
    }

    // For simple key-value pairs
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        return 2;
    }

    // For arrays or simple values
    return 1;
}

module.exports = {
    detectTier,
    getTierName,
    getTierDescription,
    getTierExample,
    matchesTier,
    recommendTier
};
