/**
 * Data charm - Variable and data manipulation
 * Tier 2 primitive for data persistence
 */
module.exports = {
    name: 'data',
    description: 'Variable and data manipulation operations',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $data[key, value]
        if (typeof args === 'string' && args.includes(',')) {
            const parts = args.split(',').map(p => p.trim());
            if (parts.length === 2) {
                return context.client.variables.set(parts[0], parts[1]);
            }
        }

        // Handle single key: $data[key] (get operation)
        if (typeof args === 'string') {
            return context.client.variables.get(args);
        }

        const { action = 'get', key, value, amount } = args;

        if (!key && action !== 'list' && action !== 'clear') {
            throw new Error('Data operation requires a key');
        }

        switch (action.toLowerCase()) {
            case 'get':
                return context.client.variables.get(key);

            case 'set':
                return context.client.variables.set(key, value);

            case 'add':
                const currentNum = Number(context.client.variables.get(key) || 0);
                const addAmount = Number(amount || value || 1);
                return context.client.variables.set(key, currentNum + addAmount);

            case 'subtract':
            case 'sub':
                const currentSub = Number(context.client.variables.get(key) || 0);
                const subAmount = Number(amount || value || 1);
                return context.client.variables.set(key, currentSub - subAmount);

            case 'multiply':
            case 'mul':
                const currentMul = Number(context.client.variables.get(key) || 0);
                const mulAmount = Number(amount || value || 1);
                return context.client.variables.set(key, currentMul * mulAmount);

            case 'divide':
            case 'div':
                const currentDiv = Number(context.client.variables.get(key) || 0);
                const divAmount = Number(amount || value || 1);
                if (divAmount === 0) throw new Error('Cannot divide by zero');
                return context.client.variables.set(key, currentDiv / divAmount);

            case 'append':
                const currentStr = String(context.client.variables.get(key) || '');
                return context.client.variables.set(key, currentStr + String(value));

            case 'prepend':
                const currentPre = String(context.client.variables.get(key) || '');
                return context.client.variables.set(key, String(value) + currentPre);

            case 'delete':
            case 'remove':
                return context.client.variables.delete(key);

            case 'exists':
                return context.client.variables.get(key) !== undefined;

            case 'type':
                return typeof context.client.variables.get(key);

            case 'length':
                const val = context.client.variables.get(key);
                if (val === undefined) return 0;
                if (typeof val === 'string' || Array.isArray(val)) return val.length;
                if (typeof val === 'object') return Object.keys(val).length;
                return String(val).length;

            case 'increment':
            case 'inc':
                const currentInc = Number(context.client.variables.get(key) || 0);
                return context.client.variables.set(key, currentInc + 1);

            case 'decrement':
            case 'dec':
                const currentDec = Number(context.client.variables.get(key) || 0);
                return context.client.variables.set(key, currentDec - 1);

            case 'list':
                // Return all variable keys
                return context.client.variables.list ? context.client.variables.list() : [];

            case 'clear':
                // Clear all variables (use with caution)
                return context.client.variables.clear ? context.client.variables.clear() : false;

            default:
                throw new Error(`Invalid data action: ${action}`);
        }
    }
};
