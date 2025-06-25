/**
 * Log charm - Logging system with levels and formatting
 * Tier 2 primitive for logging operations
 * 
 * Examples:
 * $log[info, "User joined"] - Log info message
 * $log[error, { "message": "Error occurred", "data": {...} }] - Log with data
 * $log[channel, { "level": "warn", "message": "Warning", "channel": "123456789" }] - Log to channel
 */
module.exports = {
    name: 'log',
    description: 'Logging system with levels and formatting',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $log[message]
        if (typeof args === 'string') {
            return this.log('info', args, context);
        }

        const { 
            level = 'info', 
            message, 
            data, 
            channel, 
            file = false,
            timestamp = true,
            format = 'text'
        } = args;

        // If first argument is level and second is message
        if (typeof args === 'object' && !args.level && !args.message) {
            const [logLevel, logMessage] = Object.keys(args);
            if (logLevel && logMessage) {
                return this.log(logLevel, args[logLevel], context, { data: args[logMessage] });
            }
        }

        const options = { data, channel, file, timestamp, format };
        return this.log(level, message, context, options);
    },

    /**
     * Main logging function
     */
    async log(level, message, context, options = {}) {
        try {
            const { data, channel, file, timestamp, format } = options;

            // Validate log level
            const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
            if (!validLevels.includes(level.toLowerCase())) {
                throw new Error(`Invalid log level: ${level}`);
            }

            // Create log entry
            const logEntry = {
                level: level.toLowerCase(),
                message: message,
                timestamp: new Date().toISOString(),
                data: data || null,
                context: {
                    guild: context.message?.guild?.id || null,
                    channel: context.message?.channel?.id || null,
                    user: context.message?.author?.id || null,
                    command: context.command || null
                }
            };

            // Console logging
            this.logToConsole(logEntry);

            // File logging
            if (file) {
                await this.logToFile(logEntry);
            }

            // Channel logging
            if (channel) {
                await this.logToChannel(logEntry, channel, context, format);
            }

            return {
                success: true,
                logged: true,
                level: logEntry.level,
                timestamp: logEntry.timestamp
            };

        } catch (error) {
            console.error('Log charm error:', error);
            throw new Error(`Failed to log: ${error.message}`);
        }
    },

    /**
     * Log to console with colors
     */
    logToConsole(logEntry) {
        const colors = {
            debug: '\x1b[36m',   // Cyan
            info: '\x1b[32m',    // Green
            warn: '\x1b[33m',    // Yellow
            error: '\x1b[31m',   // Red
            fatal: '\x1b[35m'    // Magenta
        };

        const reset = '\x1b[0m';
        const color = colors[logEntry.level] || colors.info;

        const timestamp = new Date(logEntry.timestamp).toLocaleString();
        const level = logEntry.level.toUpperCase().padEnd(5);
        
        let output = `${color}[${timestamp}] ${level}${reset} ${logEntry.message}`;

        if (logEntry.data) {
            output += `\n${color}Data:${reset} ${JSON.stringify(logEntry.data, null, 2)}`;
        }

        console.log(output);
    },

    /**
     * Log to file
     */
    async logToFile(logEntry) {
        try {
            const fs = require('fs').promises;
            const path = require('path');

            // Create logs directory if it doesn't exist
            const logsDir = path.join(process.cwd(), 'logs');
            await fs.mkdir(logsDir, { recursive: true });

            // Create log file path with date
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(logsDir, `${date}.log`);

            // Format log entry for file
            const logLine = JSON.stringify(logEntry) + '\n';

            // Append to log file
            await fs.appendFile(logFile, logLine, 'utf8');

        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    },

    /**
     * Log to Discord channel
     */
    async logToChannel(logEntry, channelId, context, format = 'text') {
        try {
            const targetChannel = await this.getChannel(context, channelId);
            if (!targetChannel) {
                throw new Error('Log channel not found');
            }

            let messageContent;

            switch (format.toLowerCase()) {
                case 'embed':
                    messageContent = { embeds: [this.createLogEmbed(logEntry)] };
                    break;

                case 'json':
                    messageContent = { 
                        content: `\`\`\`json\n${JSON.stringify(logEntry, null, 2)}\n\`\`\`` 
                    };
                    break;

                case 'text':
                default:
                    messageContent = { content: this.formatLogMessage(logEntry) };
                    break;
            }

            await targetChannel.send(messageContent);

        } catch (error) {
            console.error('Failed to log to channel:', error);
        }
    },

    /**
     * Create embed for log entry
     */
    createLogEmbed(logEntry) {
        const colors = {
            debug: 0x00FFFF,    // Cyan
            info: 0x00FF00,     // Green
            warn: 0xFFFF00,     // Yellow
            error: 0xFF0000,    // Red
            fatal: 0xFF00FF     // Magenta
        };

        const embed = {
            title: `${this.getLogIcon(logEntry.level)} ${logEntry.level.toUpperCase()} Log`,
            description: logEntry.message,
            color: colors[logEntry.level] || colors.info,
            timestamp: logEntry.timestamp,
            fields: []
        };

        // Add context fields
        if (logEntry.context.guild) {
            embed.fields.push({
                name: 'Guild',
                value: logEntry.context.guild,
                inline: true
            });
        }

        if (logEntry.context.channel) {
            embed.fields.push({
                name: 'Channel',
                value: `<#${logEntry.context.channel}>`,
                inline: true
            });
        }

        if (logEntry.context.user) {
            embed.fields.push({
                name: 'User',
                value: `<@${logEntry.context.user}>`,
                inline: true
            });
        }

        // Add data field if present
        if (logEntry.data) {
            embed.fields.push({
                name: 'Data',
                value: `\`\`\`json\n${JSON.stringify(logEntry.data, null, 2)}\n\`\`\``,
                inline: false
            });
        }

        return embed;
    },

    /**
     * Format log message for text output
     */
    formatLogMessage(logEntry) {
        const icon = this.getLogIcon(logEntry.level);
        const timestamp = new Date(logEntry.timestamp).toLocaleString();
        
        let message = `${icon} **${logEntry.level.toUpperCase()}** | ${timestamp}\n`;
        message += `📝 ${logEntry.message}`;

        if (logEntry.context.guild) {
            message += `\n🏠 Guild: ${logEntry.context.guild}`;
        }

        if (logEntry.context.channel) {
            message += `\n📺 Channel: <#${logEntry.context.channel}>`;
        }

        if (logEntry.context.user) {
            message += `\n👤 User: <@${logEntry.context.user}>`;
        }

        if (logEntry.data) {
            message += `\n\`\`\`json\n${JSON.stringify(logEntry.data, null, 2)}\n\`\`\``;
        }

        return message;
    },

    /**
     * Get icon for log level
     */
    getLogIcon(level) {
        const icons = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            fatal: '💀'
        };

        return icons[level] || icons.info;
    },

    /**
     * Get channel from context
     */
    async getChannel(context, channelInput) {
        if (channelInput && typeof channelInput === 'object' && channelInput.id) {
            return channelInput;
        }

        const channelId = channelInput.toString().replace(/[<#>]/g, '');
        
        try {
            return await context.client.channels.fetch(channelId);
        } catch {
            return null;
        }
    }
};
