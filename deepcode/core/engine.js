/**
 * Command execution engine
 */
class CharmEngine {
    constructor(client) {
        this.client = client;
        this.variables = client.variables;
        this.debug = client.debug || false;
    }

    /**
     * Process command code
     */
    async process(code, context) {
        try {
            // Get command parts
            const match = code.match(/^\$(\w+)\[(.*)\]$/);
            if (!match) {
                throw new Error('Invalid command syntax');
            }

            const [, charm, args] = match;

            // Get charm handler
            const charm_fn = this.client.charms.get(charm);
            if (!charm_fn) {
                throw new Error(`Unknown charm: ${charm}`);
            }

            // Parse arguments
            const parsedArgs = this.parseArgs(args);

            // Process variables
            const processedArgs = this.processVariables(parsedArgs, context);

            // Execute charm
            return await charm_fn.execute(processedArgs, context);

        } catch (error) {
            console.error('Command execution error:', error);
            throw error;
        }
    }

    /**
     * Parse command arguments
     */
    parseArgs(args) {
        if (!args) return null;

        try {
            // Try parsing as JSON first
            return JSON.parse(args);
        } catch {
            // If not JSON, return as string
            return args;
        }
    }

    /**
     * Process variables in arguments
     */
    processVariables(args, context) {
        const processValue = (value) => {
            if (typeof value === 'string') {
                // First, replace named variables like $$ping, $$uptime
                let processedValue = value.replace(/\$\$([a-zA-Z_]\w*)/g, (_, name) => {
                    return this.variables.get(name) ?? `$$${name}`;
                });

                // Then, replace positional arguments like $$1, $$2
                processedValue = processedValue.replace(/\$\$([1-9]\d*)/g, (_, indexStr) => {
                    const index = parseInt(indexStr) - 1;
                    return context.args[index] || '';
                });

                // Finally, replace $$* with all arguments joined
                if (processedValue.includes('$$*')) {
                    processedValue = processedValue.replace('$$*', context.args.join(' '));
                }
                
                return processedValue;
            }
            if (Array.isArray(value)) {
                return value.map(v => processValue(v));
            }
            if (typeof value === 'object' && value !== null) {
                const result = {};
                for (const [k, v] of Object.entries(value)) {
                    result[k] = processValue(v);
                }
                return result;
            }
            return value;
        };

        return processValue(args);
    }
}

// Export the class
module.exports = CharmEngine;
