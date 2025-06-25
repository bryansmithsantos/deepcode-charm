/**
 * Time charm - Date and time operations
 * Tier 1 primitive for time manipulation and formatting
 */
module.exports = {
    name: 'time',
    description: 'Date and time operations and formatting',
    tier: 1,

    async execute(args, context) {
        // Handle simple format: $time[DD/MM/YYYY]
        if (typeof args === 'string') {
            return this.formatTime(new Date(), args);
        }

        const { 
            action = 'format', 
            format = 'DD/MM/YYYY HH:mm:ss',
            timezone = 'UTC',
            date,
            amount,
            unit
        } = args;

        const targetDate = date ? new Date(date) : new Date();

        switch (action.toLowerCase()) {
            case 'format':
                return this.formatTime(targetDate, format, timezone);

            case 'timestamp':
                return Math.floor(targetDate.getTime() / 1000);

            case 'iso':
                return targetDate.toISOString();

            case 'add':
                return this.addTime(targetDate, amount, unit);

            case 'subtract':
                return this.subtractTime(targetDate, amount, unit);

            case 'diff':
                const { from, to = new Date(), unit: diffUnit = 'milliseconds' } = args;
                return this.timeDiff(new Date(from), new Date(to), diffUnit);

            case 'parse':
                return new Date(args.input);

            case 'now':
                return new Date();

            case 'unix':
                return Math.floor(Date.now() / 1000);

            case 'relative':
                return this.relativeTime(targetDate);

            default:
                throw new Error(`Unknown time action: ${action}`);
        }
    },

    /**
     * Format time with custom format string
     */
    formatTime(date, format, timezone = 'UTC') {
        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        // Simple format replacements
        const formatted = date.toLocaleString('en-GB', options);
        const [datePart, timePart] = formatted.split(', ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');

        return format
            .replace(/YYYY/g, year)
            .replace(/YY/g, year.slice(-2))
            .replace(/MM/g, month)
            .replace(/DD/g, day)
            .replace(/HH/g, hour)
            .replace(/mm/g, minute)
            .replace(/ss/g, second)
            .replace(/hh/g, this.to12Hour(hour))
            .replace(/A/g, parseInt(hour) >= 12 ? 'PM' : 'AM');
    },

    /**
     * Convert 24h to 12h format
     */
    to12Hour(hour24) {
        const hour = parseInt(hour24);
        if (hour === 0) return '12';
        if (hour <= 12) return hour.toString().padStart(2, '0');
        return (hour - 12).toString().padStart(2, '0');
    },

    /**
     * Add time to date
     */
    addTime(date, amount, unit) {
        const newDate = new Date(date);
        
        switch (unit.toLowerCase()) {
            case 'milliseconds':
            case 'ms':
                newDate.setMilliseconds(newDate.getMilliseconds() + amount);
                break;
            case 'seconds':
            case 's':
                newDate.setSeconds(newDate.getSeconds() + amount);
                break;
            case 'minutes':
            case 'm':
                newDate.setMinutes(newDate.getMinutes() + amount);
                break;
            case 'hours':
            case 'h':
                newDate.setHours(newDate.getHours() + amount);
                break;
            case 'days':
            case 'd':
                newDate.setDate(newDate.getDate() + amount);
                break;
            case 'weeks':
            case 'w':
                newDate.setDate(newDate.getDate() + (amount * 7));
                break;
            case 'months':
                newDate.setMonth(newDate.getMonth() + amount);
                break;
            case 'years':
            case 'y':
                newDate.setFullYear(newDate.getFullYear() + amount);
                break;
            default:
                throw new Error(`Unknown time unit: ${unit}`);
        }

        return newDate;
    },

    /**
     * Subtract time from date
     */
    subtractTime(date, amount, unit) {
        return this.addTime(date, -amount, unit);
    },

    /**
     * Calculate time difference
     */
    timeDiff(from, to, unit) {
        const diffMs = to.getTime() - from.getTime();

        switch (unit.toLowerCase()) {
            case 'milliseconds':
            case 'ms':
                return diffMs;
            case 'seconds':
            case 's':
                return Math.floor(diffMs / 1000);
            case 'minutes':
            case 'm':
                return Math.floor(diffMs / (1000 * 60));
            case 'hours':
            case 'h':
                return Math.floor(diffMs / (1000 * 60 * 60));
            case 'days':
            case 'd':
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
            case 'weeks':
            case 'w':
                return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
            default:
                return diffMs;
        }
    },

    /**
     * Get relative time string
     */
    relativeTime(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return `${diffSec} seconds ago`;
        if (diffMin < 60) return `${diffMin} minutes ago`;
        if (diffHour < 24) return `${diffHour} hours ago`;
        if (diffDay < 30) return `${diffDay} days ago`;
        
        return date.toLocaleDateString();
    }
};
