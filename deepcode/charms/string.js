/**
 * String charm - Advanced text operations
 */
module.exports = {
    name: 'string',
    description: 'String manipulation and operations',

    async execute(args, context) {
        const { action = 'get', text, options = {} } = args;

        switch (action.toLowerCase()) {
            case 'replace': {
                const { search, replace = '', regex = false, global = true, insensitive = true } = options;
                
                if (regex) {
                    const flags = `${global ? 'g' : ''}${insensitive ? 'i' : ''}`;
                    return text.replace(new RegExp(search, flags), replace);
                }
                
                return text.replaceAll(search, replace);
            }

            case 'split': {
                const { separator = ' ', limit } = options;
                return text.split(separator, limit);
            }

            case 'substring': {
                const { start = 0, end } = options;
                return text.substring(start, end);
            }

            case 'trim': {
                const { mode = 'both' } = options;
                switch (mode) {
                    case 'start': return text.trimStart();
                    case 'end': return text.trimEnd();
                    default: return text.trim();
                }
            }

            case 'case': {
                const { type = 'lower' } = options;
                switch (type) {
                    case 'upper': return text.toUpperCase();
                    case 'lower': return text.toLowerCase();
                    case 'title': return text.replace(/\w\S*/g, w => 
                        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                    case 'camel': return text.replace(/[-_\s](.)/g, (_, c) => c.toUpperCase());
                    case 'snake': return text.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
                    case 'kebab': return text.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
                    default: return text;
                }
            }

            case 'pad': {
                const { length = 0, char = ' ', position = 'start' } = options;
                switch (position) {
                    case 'end': return text.padEnd(length, char);
                    case 'both': {
                        const padTotal = length - text.length;
                        const padStart = Math.floor(padTotal / 2);
                        const padEnd = padTotal - padStart;
                        return text.padStart(text.length + padStart, char)
                                 .padEnd(length, char);
                    }
                    default: return text.padStart(length, char);
                }
            }

            case 'repeat': {
                const { count = 1, separator = '' } = options;
                return Array(count).fill(text).join(separator);
            }

            case 'reverse':
                return [...text].reverse().join('');

            case 'truncate': {
                const { length = 100, suffix = '...' } = options;
                return text.length > length ? 
                    text.slice(0, length - suffix.length) + suffix : 
                    text;
            }

            case 'random': {
                const { length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' } = options;
                return Array(length)
                    .fill(0)
                    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
                    .join('');
            }

            case 'matches': {
                const { pattern, flags = 'gi' } = options;
                const regex = new RegExp(pattern, flags);
                return Boolean(text.match(regex));
            }

            case 'extract': {
                const { pattern, flags = 'gi', group = 0 } = options;
                const regex = new RegExp(pattern, flags);
                const match = text.match(regex);
                return match ? match[group] : null;
            }

            default:
                throw new Error('Invalid string action');
        }
    }
};
