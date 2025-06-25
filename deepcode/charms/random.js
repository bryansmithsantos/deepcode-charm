/**
 * Random charm - Random number and choice generation
 * Tier 1 primitive for randomization operations
 */
module.exports = {
    name: 'random',
    description: 'Generate random numbers and make random choices',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $random[1,100]
        if (typeof args === 'string' && args.includes(',')) {
            const parts = args.split(',').map(p => p.trim());
            if (parts.length === 2) {
                const min = parseInt(parts[0]);
                const max = parseInt(parts[1]);
                return this.randomInt(min, max);
            }
        }

        // Handle single number: $random[100] (0 to 100)
        if (typeof args === 'string' || typeof args === 'number') {
            const max = parseInt(args);
            return this.randomInt(0, max);
        }

        // Handle object format
        const { type = 'int', min = 0, max = 100, choices, length = 10, chars } = args;

        switch (type.toLowerCase()) {
            case 'int':
            case 'integer':
                return this.randomInt(min, max);

            case 'float':
            case 'decimal':
                return this.randomFloat(min, max);

            case 'choice':
            case 'pick':
                if (!choices || !Array.isArray(choices)) {
                    throw new Error('Random choice requires an array of choices');
                }
                return this.randomChoice(choices);

            case 'boolean':
            case 'bool':
                return Math.random() < 0.5;

            case 'string':
            case 'text':
                return this.randomString(length, chars);

            case 'hex':
                return this.randomHex(length);

            case 'uuid':
                return this.randomUUID();

            case 'color':
                return this.randomColor();

            default:
                throw new Error(`Unknown random type: ${type}`);
        }
    },

    /**
     * Generate random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Generate random float between min and max
     */
    randomFloat(min, max, precision = 2) {
        const result = Math.random() * (max - min) + min;
        return parseFloat(result.toFixed(precision));
    },

    /**
     * Pick random element from array
     */
    randomChoice(choices) {
        return choices[Math.floor(Math.random() * choices.length)];
    },

    /**
     * Generate random string
     */
    randomString(length, chars) {
        const defaultChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charset = chars || defaultChars;
        
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    },

    /**
     * Generate random hex string
     */
    randomHex(length) {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Generate random UUID v4
     */
    randomUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Generate random color
     */
    randomColor() {
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000'
        ];
        return this.randomChoice(colors);
    }
};
