/**
 * Regex charm - Regular expression operations
 * Tier 3 primitive for pattern matching and text processing
 * 
 * Examples:
 * $regex[test, { "pattern": "\\d+", "text": "123abc", "flags": "g" }] - Test pattern
 * $regex[match, { "pattern": "\\w+", "text": "hello world" }] - Find matches
 * $regex[replace, { "pattern": "\\d+", "text": "abc123def", "replacement": "XXX" }] - Replace
 */
module.exports = {
    name: 'regex',
    description: 'Regular expression operations and pattern matching',
    tier: 3,

    async execute(args, context) {
        // Handle simple format: $regex[pattern, text]
        if (typeof args === 'string' && args.includes(',')) {
            const [pattern, text] = args.split(',').map(s => s.trim());
            return this.test(pattern, text);
        }

        const { 
            action = 'test',
            pattern,
            text,
            flags = '',
            replacement,
            global = false,
            ignoreCase = false,
            multiline = false
        } = args;

        // Build flags from options
        let regexFlags = flags;
        if (global && !regexFlags.includes('g')) regexFlags += 'g';
        if (ignoreCase && !regexFlags.includes('i')) regexFlags += 'i';
        if (multiline && !regexFlags.includes('m')) regexFlags += 'm';

        switch (action.toLowerCase()) {
            case 'test':
                return this.test(pattern, text, regexFlags);

            case 'match':
            case 'find':
                return this.match(pattern, text, regexFlags);

            case 'replace':
                return this.replace(pattern, text, replacement, regexFlags);

            case 'split':
                return this.split(pattern, text, regexFlags);

            case 'extract':
                return this.extract(pattern, text, regexFlags);

            case 'validate':
                return this.validate(pattern, regexFlags);

            case 'escape':
                return this.escape(text);

            case 'count':
                return this.count(pattern, text, regexFlags);

            default:
                throw new Error(`Unknown regex action: ${action}`);
        }
    },

    /**
     * Test if pattern matches text
     */
    test(pattern, text, flags = '') {
        if (!pattern || text === undefined) {
            throw new Error('Pattern and text are required');
        }

        try {
            const regex = new RegExp(pattern, flags);
            const result = regex.test(text.toString());

            return {
                success: true,
                pattern: pattern,
                text: text,
                flags: flags,
                matches: result
            };
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${error.message}`);
        }
    },

    /**
     * Find matches in text
     */
    match(pattern, text, flags = '') {
        if (!pattern || text === undefined) {
            throw new Error('Pattern and text are required');
        }

        try {
            const regex = new RegExp(pattern, flags);
            const textStr = text.toString();
            
            let matches = [];
            
            if (flags.includes('g')) {
                // Global search - find all matches
                let match;
                while ((match = regex.exec(textStr)) !== null) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                        namedGroups: match.groups || {}
                    });
                    
                    // Prevent infinite loop
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                }
            } else {
                // Single match
                const match = textStr.match(regex);
                if (match) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                        namedGroups: match.groups || {}
                    });
                }
            }

            return {
                success: true,
                pattern: pattern,
                text: text,
                flags: flags,
                matches: matches,
                count: matches.length
            };
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${error.message}`);
        }
    },

    /**
     * Replace matches in text
     */
    replace(pattern, text, replacement, flags = '') {
        if (!pattern || text === undefined || replacement === undefined) {
            throw new Error('Pattern, text, and replacement are required');
        }

        try {
            const regex = new RegExp(pattern, flags);
            const textStr = text.toString();
            const replacementStr = replacement.toString();
            
            const result = textStr.replace(regex, replacementStr);
            const originalMatches = this.match(pattern, text, flags);

            return {
                success: true,
                pattern: pattern,
                text: text,
                replacement: replacement,
                flags: flags,
                result: result,
                replacements: originalMatches.count
            };
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${error.message}`);
        }
    },

    /**
     * Split text by pattern
     */
    split(pattern, text, flags = '') {
        if (!pattern || text === undefined) {
            throw new Error('Pattern and text are required');
        }

        try {
            const regex = new RegExp(pattern, flags);
            const textStr = text.toString();
            
            const parts = textStr.split(regex);

            return {
                success: true,
                pattern: pattern,
                text: text,
                flags: flags,
                parts: parts,
                count: parts.length
            };
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${error.message}`);
        }
    },

    /**
     * Extract specific groups from matches
     */
    extract(pattern, text, flags = '') {
        if (!pattern || text === undefined) {
            throw new Error('Pattern and text are required');
        }

        try {
            const matchResult = this.match(pattern, text, flags);
            
            const extracted = matchResult.matches.map(match => ({
                fullMatch: match.match,
                groups: match.groups,
                namedGroups: match.namedGroups,
                index: match.index
            }));

            return {
                success: true,
                pattern: pattern,
                text: text,
                flags: flags,
                extracted: extracted,
                count: extracted.length
            };
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${error.message}`);
        }
    },

    /**
     * Validate regex pattern
     */
    validate(pattern, flags = '') {
        if (!pattern) {
            throw new Error('Pattern is required');
        }

        try {
            new RegExp(pattern, flags);
            
            return {
                success: true,
                pattern: pattern,
                flags: flags,
                valid: true
            };
        } catch (error) {
            return {
                success: false,
                pattern: pattern,
                flags: flags,
                valid: false,
                error: error.message
            };
        }
    },

    /**
     * Escape special regex characters
     */
    escape(text) {
        if (text === undefined) {
            throw new Error('Text is required');
        }

        const escaped = text.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        return {
            success: true,
            original: text,
            escaped: escaped
        };
    },

    /**
     * Count matches in text
     */
    count(pattern, text, flags = '') {
        if (!pattern || text === undefined) {
            throw new Error('Pattern and text are required');
        }

        try {
            // Ensure global flag for counting
            const globalFlags = flags.includes('g') ? flags : flags + 'g';
            const matchResult = this.match(pattern, text, globalFlags);

            return {
                success: true,
                pattern: pattern,
                text: text,
                flags: flags,
                count: matchResult.count
            };
        } catch (error) {
            throw new Error(`Invalid regex pattern: ${error.message}`);
        }
    }
};
