/**
 * Math charm - Mathematical operations and calculations
 * Tier 1 primitive for basic mathematical operations
 */
module.exports = {
    name: 'math',
    description: 'Mathematical operations and calculations',
    tier: 1,

    async execute(args, context) {
        const { operation, values, precision = 2 } = args;

        // Handle simple operations with two values
        if (typeof args === 'string' && args.includes(',')) {
            const parts = args.split(',').map(p => p.trim());
            if (parts.length >= 3) {
                const [op, val1, val2] = parts;
                return this.performOperation(op, [parseFloat(val1), parseFloat(val2)], precision);
            }
        }

        // Handle object format
        if (!operation || !values) {
            throw new Error('Math operation requires operation and values');
        }

        const numValues = Array.isArray(values) ? 
            values.map(v => parseFloat(v)) : 
            [parseFloat(values)];

        return this.performOperation(operation, numValues, precision);
    },

    performOperation(operation, values, precision) {
        let result;

        switch (operation.toLowerCase()) {
            case 'add':
            case '+':
                result = values.reduce((sum, val) => sum + val, 0);
                break;

            case 'subtract':
            case 'sub':
            case '-':
                result = values.reduce((diff, val, index) => 
                    index === 0 ? val : diff - val);
                break;

            case 'multiply':
            case 'mul':
            case '*':
                result = values.reduce((prod, val) => prod * val, 1);
                break;

            case 'divide':
            case 'div':
            case '/':
                result = values.reduce((quot, val, index) => {
                    if (index === 0) return val;
                    if (val === 0) throw new Error('Division by zero');
                    return quot / val;
                });
                break;

            case 'power':
            case 'pow':
            case '^':
                result = Math.pow(values[0], values[1]);
                break;

            case 'sqrt':
                result = Math.sqrt(values[0]);
                break;

            case 'abs':
                result = Math.abs(values[0]);
                break;

            case 'round':
                result = Math.round(values[0]);
                break;

            case 'floor':
                result = Math.floor(values[0]);
                break;

            case 'ceil':
                result = Math.ceil(values[0]);
                break;

            case 'min':
                result = Math.min(...values);
                break;

            case 'max':
                result = Math.max(...values);
                break;

            case 'average':
            case 'avg':
                result = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;

            case 'sum':
                result = values.reduce((sum, val) => sum + val, 0);
                break;

            case 'mod':
            case '%':
                result = values[0] % values[1];
                break;

            case 'sin':
                result = Math.sin(values[0]);
                break;

            case 'cos':
                result = Math.cos(values[0]);
                break;

            case 'tan':
                result = Math.tan(values[0]);
                break;

            case 'log':
                result = Math.log(values[0]);
                break;

            case 'log10':
                result = Math.log10(values[0]);
                break;

            case 'random':
                const min = values[0] || 0;
                const max = values[1] || 1;
                result = Math.random() * (max - min) + min;
                break;

            default:
                throw new Error(`Unknown math operation: ${operation}`);
        }

        // Apply precision
        if (typeof result === 'number' && !Number.isInteger(result)) {
            return parseFloat(result.toFixed(precision));
        }

        return result;
    }
};
