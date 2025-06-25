/**
 * JSON charm - JSON data manipulation and parsing
 * Tier 2 primitive for data operations
 */
module.exports = {
    name: 'json',
    description: 'JSON data manipulation and parsing operations',
    tier: 2,

    async execute(args, context) {
        const { action = 'get', data, path, value, options = {} } = args;

        switch (action.toLowerCase()) {
            case 'parse':
                return this.parseJSON(data);

            case 'stringify':
                return this.stringifyJSON(data, options);

            case 'get':
                return this.getPath(data, path);

            case 'set':
                return this.setPath(data, path, value);

            case 'delete':
                return this.deletePath(data, path);

            case 'has':
                return this.hasPath(data, path);

            case 'keys':
                return this.getKeys(data, path);

            case 'values':
                return this.getValues(data, path);

            case 'merge':
                return this.mergeObjects(data, value);

            case 'clone':
                return this.cloneObject(data);

            case 'validate':
                return this.validateJSON(data);

            case 'flatten':
                return this.flattenObject(data);

            case 'unflatten':
                return this.unflattenObject(data);

            default:
                throw new Error(`Unknown JSON action: ${action}`);
        }
    },

    /**
     * Parse JSON string
     */
    parseJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error(`Invalid JSON: ${error.message}`);
        }
    },

    /**
     * Stringify object to JSON
     */
    stringifyJSON(obj, options) {
        const { pretty = false, space = 2 } = options;
        try {
            return JSON.stringify(obj, null, pretty ? space : 0);
        } catch (error) {
            throw new Error(`Cannot stringify: ${error.message}`);
        }
    },

    /**
     * Get value at path
     */
    getPath(obj, path) {
        if (!path) return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined) return undefined;
            current = current[key];
        }
        
        return current;
    },

    /**
     * Set value at path
     */
    setPath(obj, path, value) {
        if (!path) return value;
        
        const result = this.cloneObject(obj);
        const keys = path.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined || current[key] === null) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        return result;
    },

    /**
     * Delete value at path
     */
    deletePath(obj, path) {
        if (!path) return undefined;
        
        const result = this.cloneObject(obj);
        const keys = path.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined || current[key] === null) {
                return result;
            }
            current = current[key];
        }
        
        delete current[keys[keys.length - 1]];
        return result;
    },

    /**
     * Check if path exists
     */
    hasPath(obj, path) {
        return this.getPath(obj, path) !== undefined;
    },

    /**
     * Get object keys
     */
    getKeys(obj, path) {
        const target = path ? this.getPath(obj, path) : obj;
        if (typeof target !== 'object' || target === null) return [];
        return Object.keys(target);
    },

    /**
     * Get object values
     */
    getValues(obj, path) {
        const target = path ? this.getPath(obj, path) : obj;
        if (typeof target !== 'object' || target === null) return [];
        return Object.values(target);
    },

    /**
     * Merge objects
     */
    mergeObjects(obj1, obj2) {
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
            throw new Error('Both arguments must be objects');
        }
        
        return { ...obj1, ...obj2 };
    },

    /**
     * Deep clone object
     */
    cloneObject(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Validate JSON string
     */
    validateJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Flatten nested object
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(flattened, this.flattenObject(obj[key], newKey));
                } else {
                    flattened[newKey] = obj[key];
                }
            }
        }
        
        return flattened;
    },

    /**
     * Unflatten object
     */
    unflattenObject(obj) {
        const result = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.setPath(result, key, obj[key]);
            }
        }
        
        return result;
    }
};
