const chalk = require('chalk');

/**
 * Error event handler
 */
module.exports = {
    name: 'error',
    description: 'Handle bot errors',

    async execute(error, client) {
        try {
            // Log error with details
            console.error(chalk.red('\nBot Error:'), error);

            // Track error in variables if enabled
            if (client.variables?.update) {
                client.variables.update('errors', {
                    count: (client.variables.get('errors.count') || 0) + 1,
                    last: {
                        message: error.message,
                        code: error.code,
                        timestamp: Date.now(),
                        stack: error.stack
                    }
                });
            }

            // Log to debug channel if configured
            const debugChannel = client.config?.debugChannel;
            if (debugChannel) {
                try {
                    const channel = await client.channels.fetch(debugChannel);
                    if (channel) {
                        await channel.send({
                            embeds: [{
                                title: 'Bot Error',
                                description: `\`\`\`\n${error.stack || error.message}\n\`\`\``,
                                color: 0xFF0000,
                                timestamp: new Date()
                            }]
                        });
                    }
                } catch (channelError) {
                    console.error('Failed to send error to debug channel:', channelError);
                }
            }

        } catch (handlerError) {
            // If error handler fails, log to console as last resort
            console.error(chalk.red('\nError Handler Failed:'), handlerError);
            console.error(chalk.red('Original Error:'), error);
        }
    }
};
