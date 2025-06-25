/**
 * Cache charm - Memory caching operations
 * Tier 2 primitive for temporary data storage
 * 
 * Examples:
 * $cache[set, { "key": "user_123", "value": "data", "ttl": 3600 }] - Set with TTL
 * $cache[get, "user_123"] - Get cached value
 * $cache[clear] - Clear all cache
 */
module.exports = {
    name: 'cache',
    description: 'Memory caching operations with TTL support',
    tier: 2,

    // Static cache storage
    _cache: new Map(),
    _timers: new Map(),

    async execute(args, context) {
        // Handle simple format: $cache[key]
        if (typeof args === 'string') {
            return this.get(args);
        }

        const { 
            action = 'get', 
            key, 
            value, 
            ttl, 
            pattern,
            prefix = '',
            format = 'value'
        } = args;

        switch (action.toLowerCase()) {
            case 'set':
                return this.set(key, value, ttl);

            case 'get':
                return this.get(key, format);

            case 'delete':
            case 'remove':
                return this.delete(key);

            case 'exists':
            case 'has':
                return this.exists(key);

            case 'clear':
                return this.clear(pattern);

            case 'keys':
                return this.keys(pattern, prefix);

            case 'values':
                return this.values(pattern, prefix);

            case 'size':
            case 'count':
                return this.size(pattern, prefix);

            case 'ttl':
                return this.getTTL(key);

            case 'expire':
                return this.expire(key, ttl);

            case 'persist':
                return this.persist(key);

            case 'increment':
            case 'inc':
                return this.increment(key, value || 1);

            case 'decrement':
            case 'dec':
                return this.decrement(key, value || 1);

            default:
                throw new Error(`Unknown cache action: ${action}`);
        }
    },

    /**
     * Set cache value with optional TTL
     */
    set(key, value, ttl) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        // Clear existing timer if any
        if (this._timers.has(key)) {
            clearTimeout(this._timers.get(key));
            this._timers.delete(key);
        }

        // Store value with metadata
        const cacheEntry = {
            value: value,
            createdAt: Date.now(),
            expiresAt: ttl ? Date.now() + (ttl * 1000) : null
        };

        this._cache.set(key, cacheEntry);

        // Set expiration timer if TTL is provided
        if (ttl && ttl > 0) {
            const timer = setTimeout(() => {
                this._cache.delete(key);
                this._timers.delete(key);
            }, ttl * 1000);

            this._timers.set(key, timer);
        }

        return {
            success: true,
            key: key,
            value: value,
            ttl: ttl || null,
            expiresAt: cacheEntry.expiresAt
        };
    },

    /**
     * Get cache value
     */
    get(key, format = 'value') {
        if (!key) {
            throw new Error('Cache key is required');
        }

        const entry = this._cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            return null;
        }

        switch (format.toLowerCase()) {
            case 'full':
            case 'metadata':
                return {
                    key: key,
                    value: entry.value,
                    createdAt: entry.createdAt,
                    expiresAt: entry.expiresAt,
                    ttl: entry.expiresAt ? Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000)) : null
                };

            case 'value':
            default:
                return entry.value;
        }
    },

    /**
     * Delete cache entry
     */
    delete(key) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        const existed = this._cache.has(key);
        
        // Clear timer if exists
        if (this._timers.has(key)) {
            clearTimeout(this._timers.get(key));
            this._timers.delete(key);
        }

        this._cache.delete(key);

        return {
            success: true,
            key: key,
            existed: existed
        };
    },

    /**
     * Check if key exists
     */
    exists(key) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        const entry = this._cache.get(key);
        
        if (!entry) {
            return false;
        }

        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            return false;
        }

        return true;
    },

    /**
     * Clear cache (all or by pattern)
     */
    clear(pattern) {
        let clearedCount = 0;

        if (!pattern) {
            // Clear all
            clearedCount = this._cache.size;
            
            // Clear all timers
            for (const timer of this._timers.values()) {
                clearTimeout(timer);
            }
            
            this._cache.clear();
            this._timers.clear();
        } else {
            // Clear by pattern
            const regex = new RegExp(pattern);
            const keysToDelete = [];

            for (const key of this._cache.keys()) {
                if (regex.test(key)) {
                    keysToDelete.push(key);
                }
            }

            for (const key of keysToDelete) {
                this.delete(key);
                clearedCount++;
            }
        }

        return {
            success: true,
            clearedCount: clearedCount,
            pattern: pattern || 'all'
        };
    },

    /**
     * Get all keys (optionally filtered)
     */
    keys(pattern, prefix = '') {
        let keys = Array.from(this._cache.keys());

        // Filter by prefix
        if (prefix) {
            keys = keys.filter(key => key.startsWith(prefix));
        }

        // Filter by pattern
        if (pattern) {
            const regex = new RegExp(pattern);
            keys = keys.filter(key => regex.test(key));
        }

        // Remove expired keys
        keys = keys.filter(key => this.exists(key));

        return keys;
    },

    /**
     * Get all values (optionally filtered)
     */
    values(pattern, prefix = '') {
        const keys = this.keys(pattern, prefix);
        return keys.map(key => this.get(key));
    },

    /**
     * Get cache size
     */
    size(pattern, prefix = '') {
        return this.keys(pattern, prefix).length;
    },

    /**
     * Get TTL for key
     */
    getTTL(key) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        const entry = this._cache.get(key);
        
        if (!entry) {
            return -2; // Key doesn't exist
        }

        if (!entry.expiresAt) {
            return -1; // No expiration
        }

        const ttl = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
        
        if (ttl === 0) {
            this.delete(key);
            return -2; // Key expired
        }

        return ttl;
    },

    /**
     * Set expiration for existing key
     */
    expire(key, ttl) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        if (!ttl || ttl <= 0) {
            throw new Error('TTL must be a positive number');
        }

        const entry = this._cache.get(key);
        
        if (!entry) {
            return {
                success: false,
                error: 'Key not found'
            };
        }

        // Clear existing timer
        if (this._timers.has(key)) {
            clearTimeout(this._timers.get(key));
        }

        // Update expiration
        entry.expiresAt = Date.now() + (ttl * 1000);

        // Set new timer
        const timer = setTimeout(() => {
            this._cache.delete(key);
            this._timers.delete(key);
        }, ttl * 1000);

        this._timers.set(key, timer);

        return {
            success: true,
            key: key,
            ttl: ttl,
            expiresAt: entry.expiresAt
        };
    },

    /**
     * Remove expiration from key
     */
    persist(key) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        const entry = this._cache.get(key);
        
        if (!entry) {
            return {
                success: false,
                error: 'Key not found'
            };
        }

        // Clear timer
        if (this._timers.has(key)) {
            clearTimeout(this._timers.get(key));
            this._timers.delete(key);
        }

        // Remove expiration
        entry.expiresAt = null;

        return {
            success: true,
            key: key,
            persistent: true
        };
    },

    /**
     * Increment numeric value
     */
    increment(key, amount = 1) {
        if (!key) {
            throw new Error('Cache key is required');
        }

        const current = this.get(key) || 0;
        const newValue = Number(current) + Number(amount);
        
        // Preserve TTL
        const entry = this._cache.get(key);
        const ttl = entry && entry.expiresAt ? 
            Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000)) : 
            null;

        this.set(key, newValue, ttl);

        return newValue;
    },

    /**
     * Decrement numeric value
     */
    decrement(key, amount = 1) {
        return this.increment(key, -amount);
    }
};
