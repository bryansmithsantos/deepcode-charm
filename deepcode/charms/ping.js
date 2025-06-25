/**
 * Ping charm - Get bot latency and connection status
 * Tier 1 primitive for connection information
 */
module.exports = {
    name: 'ping',
    description: 'Get bot latency and connection status',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $ping (returns API latency)
        if (!args || typeof args === 'string' && !args.trim()) {
            return Math.round(context.client.ws.ping);
        }

        const { type = 'api', format = 'number', unit = 'ms' } = args;

        switch (type.toLowerCase()) {
            case 'api':
            case 'websocket':
            case 'ws':
                return this.formatLatency(context.client.ws.ping, format, unit);

            case 'roundtrip':
            case 'message':
                return await this.getRoundtripLatency(context, format, unit);

            case 'database':
            case 'db':
                return await this.getDatabaseLatency(context, format, unit);

            case 'all':
            case 'detailed':
                return await this.getAllLatencies(context, format);

            case 'status':
                return this.getConnectionStatus(context);

            default:
                throw new Error(`Unknown ping type: ${type}`);
        }
    },

    /**
     * Get roundtrip latency by sending a message
     */
    async getRoundtripLatency(context, format, unit) {
        const start = Date.now();
        
        try {
            // Send a temporary message to measure roundtrip time
            const tempMessage = await context.message.channel.send('🏓 Calculating ping...');
            const latency = Date.now() - start;
            
            // Delete the temporary message
            await tempMessage.delete().catch(() => {});
            
            return this.formatLatency(latency, format, unit);
        } catch (error) {
            throw new Error(`Failed to measure roundtrip latency: ${error.message}`);
        }
    },

    /**
     * Get database latency (if database operations are available)
     */
    async getDatabaseLatency(context, format, unit) {
        const start = Date.now();
        
        try {
            // Try to perform a simple database operation
            if (context.client.variables && context.client.variables.get) {
                await context.client.variables.get('ping_test');
                const latency = Date.now() - start;
                return this.formatLatency(latency, format, unit);
            } else {
                return this.formatLatency(0, format, unit);
            }
        } catch (error) {
            return this.formatLatency(-1, format, unit); // -1 indicates error
        }
    },

    /**
     * Get all latency measurements
     */
    async getAllLatencies(context, format) {
        const apiPing = Math.round(context.client.ws.ping);
        
        // Get roundtrip latency
        let roundtripPing;
        try {
            const start = Date.now();
            const tempMessage = await context.message.channel.send('🏓');
            roundtripPing = Date.now() - start;
            await tempMessage.delete().catch(() => {});
        } catch {
            roundtripPing = -1;
        }

        // Get database latency
        let dbPing;
        try {
            const start = Date.now();
            if (context.client.variables && context.client.variables.get) {
                await context.client.variables.get('ping_test');
                dbPing = Date.now() - start;
            } else {
                dbPing = 0;
            }
        } catch {
            dbPing = -1;
        }

        const result = {
            api: apiPing,
            roundtrip: roundtripPing,
            database: dbPing,
            status: this.getConnectionStatus(context)
        };

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(result);
            case 'string':
                return `API: ${apiPing}ms | Roundtrip: ${roundtripPing}ms | DB: ${dbPing}ms | Status: ${result.status}`;
            case 'object':
            default:
                return result;
        }
    },

    /**
     * Get connection status
     */
    getConnectionStatus(context) {
        const ping = context.client.ws.ping;
        const status = context.client.ws.status;

        // Determine status based on ping and WebSocket status
        if (status !== 0) { // 0 = READY
            return 'disconnected';
        }

        if (ping < 0) {
            return 'unknown';
        } else if (ping < 100) {
            return 'excellent';
        } else if (ping < 200) {
            return 'good';
        } else if (ping < 500) {
            return 'fair';
        } else if (ping < 1000) {
            return 'poor';
        } else {
            return 'terrible';
        }
    },

    /**
     * Format latency value
     */
    formatLatency(latency, format, unit) {
        // Handle error cases
        if (latency < 0) {
            switch (format.toLowerCase()) {
                case 'string':
                    return 'Error';
                case 'boolean':
                    return false;
                default:
                    return -1;
            }
        }

        // Convert units if needed
        let value = latency;
        switch (unit.toLowerCase()) {
            case 's':
            case 'seconds':
                value = latency / 1000;
                break;
            case 'ms':
            case 'milliseconds':
            default:
                value = latency;
                break;
        }

        // Format output
        switch (format.toLowerCase()) {
            case 'string':
                return `${Math.round(value)}${unit}`;
            case 'number':
                return Math.round(value);
            case 'float':
                return parseFloat(value.toFixed(2));
            case 'boolean':
                return value > 0;
            case 'status':
                if (value < 100) return 'excellent';
                if (value < 200) return 'good';
                if (value < 500) return 'fair';
                if (value < 1000) return 'poor';
                return 'terrible';
            default:
                return Math.round(value);
        }
    }
};
