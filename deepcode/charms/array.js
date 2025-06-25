/**
 * Array charm - Array and collection operations
 */
module.exports = {
    name: 'array',
    description: 'Array manipulation and operations',

    async execute(args, context) {
        const { action = 'get', array, value, options = {} } = args;

        switch (action.toLowerCase()) {
            case 'get': {
                const arr = this.getArray(array, context);
                const { index } = options;
                return index !== undefined ? arr[index] : arr;
            }

            case 'push': {
                const arr = this.getArray(array, context);
                arr.push(value);
                this.saveArray(array, arr, context);
                return arr;
            }

            case 'pop': {
                const arr = this.getArray(array, context);
                const popped = arr.pop();
                this.saveArray(array, arr, context);
                return popped;
            }

            case 'shift': {
                const arr = this.getArray(array, context);
                const shifted = arr.shift();
                this.saveArray(array, arr, context);
                return shifted;
            }

            case 'unshift': {
                const arr = this.getArray(array, context);
                arr.unshift(value);
                this.saveArray(array, arr, context);
                return arr;
            }

            case 'join': {
                const arr = this.getArray(array, context);
                const { separator = ',' } = options;
                return arr.join(separator);
            }

            case 'slice': {
                const arr = this.getArray(array, context);
                const { start = 0, end } = options;
                return arr.slice(start, end);
            }

            case 'splice': {
                const arr = this.getArray(array, context);
                const { start, deleteCount = 0, items = [] } = options;
                const result = arr.splice(start, deleteCount, ...items);
                this.saveArray(array, arr, context);
                return result;
            }

            case 'sort': {
                const arr = this.getArray(array, context);
                const { key, reverse = false } = options;
                
                const sorted = [...arr].sort((a, b) => {
                    const aVal = key ? a[key] : a;
                    const bVal = key ? b[key] : b;
                    return reverse ? bVal - aVal : aVal - bVal;
                });
                
                this.saveArray(array, sorted, context);
                return sorted;
            }

            case 'filter': {
                const arr = this.getArray(array, context);
                const { key, value: filterValue } = options;
                return arr.filter(item => {
                    const itemValue = key ? item[key] : item;
                    return itemValue === filterValue;
                });
            }

            case 'map': {
                const arr = this.getArray(array, context);
                const { key } = options;
                return arr.map(item => key ? item[key] : item);
            }

            case 'find': {
                const arr = this.getArray(array, context);
                const { key, value: searchValue } = options;
                return arr.find(item => {
                    const itemValue = key ? item[key] : item;
                    return itemValue === searchValue;
                });
            }

            case 'includes': {
                const arr = this.getArray(array, context);
                return arr.includes(value);
            }

            case 'random': {
                const arr = this.getArray(array, context);
                const { count = 1 } = options;
                
                if (count === 1) {
                    const index = Math.floor(Math.random() * arr.length);
                    return arr[index];
                }
                
                const result = [];
                const indexes = new Set();
                while (indexes.size < count && indexes.size < arr.length) {
                    indexes.add(Math.floor(Math.random() * arr.length));
                }
                return [...indexes].map(i => arr[i]);
            }

            case 'clear': {
                const arr = [];
                this.saveArray(array, arr, context);
                return arr;
            }

            default:
                throw new Error('Invalid array action');
        }
    },

    /**
     * Get array from variable or create new
     */
    getArray(name, context) {
        let arr = context.client.variables.get(name);
        if (!Array.isArray(arr)) {
            arr = [];
            context.client.variables.set(name, arr);
        }
        return arr;
    },

    /**
     * Save array to variable
     */
    saveArray(name, array, context) {
        context.client.variables.set(name, array);
    }
};
