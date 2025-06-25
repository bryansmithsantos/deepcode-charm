/**
 * Uptime charm - Get bot uptime and process information
 * Tier 1 primitive for system status information
 */
module.exports = {
    name: 'uptime',
    description: 'Get bot uptime and process information',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $uptime (returns formatted uptime)
        if (!args || typeof args === 'string' && !args.trim()) {
            return this.formatUptime(process.uptime(), 'string');
        }

        const { type = 'process', format = 'string', unit = 'auto' } = args;

        switch (type.toLowerCase()) {
            case 'process':
            case 'bot':
                return this.getProcessUptime(format, unit);

            case 'system':
            case 'os':
                return this.getSystemUptime(format, unit);

            case 'client':
            case 'ready':
                return this.getClientUptime(context, format, unit);

            case 'all':
            case 'detailed':
                return this.getAllUptimes(context, format);

            default:
                throw new Error(`Unknown uptime type: ${type}`);
        }
    },

    /**
     * Get process uptime
     */
    getProcessUptime(format, unit) {
        const uptime = process.uptime();
        return this.formatUptime(uptime, format, unit);
    },

    /**
     * Get system uptime
     */
    getSystemUptime(format, unit) {
        const os = require('os');
        const uptime = os.uptime();
        return this.formatUptime(uptime, format, unit);
    },

    /**
     * Get client ready uptime
     */
    getClientUptime(context, format, unit) {
        if (!context.client.readyAt) {
            return this.formatUptime(0, format, unit);
        }
        
        const uptime = (Date.now() - context.client.readyAt.getTime()) / 1000;
        return this.formatUptime(uptime, format, unit);
    },

    /**
     * Get all uptime measurements
     */
    getAllUptimes(context, format) {
        const os = require('os');
        
        const processUptime = process.uptime();
        const systemUptime = os.uptime();
        const clientUptime = context.client.readyAt ? 
            (Date.now() - context.client.readyAt.getTime()) / 1000 : 0;

        const result = {
            process: processUptime,
            system: systemUptime,
            client: clientUptime,
            processFormatted: this.formatUptime(processUptime, 'string'),
            systemFormatted: this.formatUptime(systemUptime, 'string'),
            clientFormatted: this.formatUptime(clientUptime, 'string')
        };

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(result);
            case 'string':
                return `Process: ${result.processFormatted} | System: ${result.systemFormatted} | Client: ${result.clientFormatted}`;
            case 'object':
            default:
                return result;
        }
    },

    /**
     * Format uptime value
     */
    formatUptime(seconds, format, unit = 'auto') {
        if (seconds < 0) seconds = 0;

        // Convert to requested unit
        let value = seconds;
        let unitLabel = 's';

        switch (unit.toLowerCase()) {
            case 'ms':
            case 'milliseconds':
                value = seconds * 1000;
                unitLabel = 'ms';
                break;
            case 's':
            case 'seconds':
                value = seconds;
                unitLabel = 's';
                break;
            case 'm':
            case 'minutes':
                value = seconds / 60;
                unitLabel = 'm';
                break;
            case 'h':
            case 'hours':
                value = seconds / 3600;
                unitLabel = 'h';
                break;
            case 'd':
            case 'days':
                value = seconds / 86400;
                unitLabel = 'd';
                break;
            case 'auto':
            default:
                // Auto-format based on duration
                return this.autoFormatUptime(seconds, format);
        }

        // Format output
        switch (format.toLowerCase()) {
            case 'number':
                return Math.floor(value);
            case 'float':
                return parseFloat(value.toFixed(2));
            case 'string':
                return `${Math.floor(value)}${unitLabel}`;
            case 'timestamp':
                return Math.floor(Date.now() / 1000 - seconds);
            case 'relative':
                return `<t:${Math.floor(Date.now() / 1000 - seconds)}:R>`;
            default:
                return Math.floor(value);
        }
    },

    /**
     * Auto-format uptime with appropriate units
     */
    autoFormatUptime(seconds, format) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        switch (format.toLowerCase()) {
            case 'object':
                return { days, hours, minutes, seconds: secs, total: seconds };

            case 'array':
                return [days, hours, minutes, secs];

            case 'compact':
                if (days > 0) return `${days}d ${hours}h`;
                if (hours > 0) return `${hours}h ${minutes}m`;
                if (minutes > 0) return `${minutes}m ${secs}s`;
                return `${secs}s`;

            case 'short':
                const parts = [];
                if (days > 0) parts.push(`${days}d`);
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}m`);
                if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
                return parts.join(' ');

            case 'long':
                const longParts = [];
                if (days > 0) longParts.push(`${days} day${days !== 1 ? 's' : ''}`);
                if (hours > 0) longParts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
                if (minutes > 0) longParts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
                if (secs > 0 || longParts.length === 0) longParts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
                return longParts.join(', ');

            case 'digital':
                if (days > 0) {
                    return `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            case 'string':
            default:
                // Default string format
                if (days > 0) {
                    return `${days}d ${hours}h ${minutes}m`;
                } else if (hours > 0) {
                    return `${hours}h ${minutes}m`;
                } else if (minutes > 0) {
                    return `${minutes}m ${secs}s`;
                } else {
                    return `${secs}s`;
                }
        }
    }
};
