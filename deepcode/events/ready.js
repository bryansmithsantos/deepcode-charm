/**
 * Ready event handler
 */
module.exports = {
    name: 'ready',
    description: 'Handle bot ready state',
    once: true,

    async execute(client) {
        try {
            // Set bot status
            client.user.setActivity(client.config?.status?.text || `commands | ${client.prefix}help`, {
                type: client.config?.status?.type || 'PLAYING',
                url: client.config?.status?.url
            });

            // Update stats
            if (client.variables?.set) {
                client.variables.set('stats', {
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size,
                    channels: client.channels.cache.size,
                    commands: client.commands?.items?.size || 0,
                    events: client.events?.items?.size || 0
                });
            }

            // Start intervals
            this.startIntervals(client);

            // Log success
            console.log(`\n✓ Bot is ready! Logged in as ${client.user.tag}`);
            console.log(`  Guilds: ${client.guilds.cache.size}`);
            console.log(`  Users: ${client.users.cache.size}`);
            console.log(`  Commands: ${client.commands?.items?.size || 0}`);
            console.log();

        } catch (error) {
            console.error('Error in ready event:', error);
        }
    },

    /**
     * Start interval tasks
     */
    startIntervals(client) {
        // Update stats every minute
        setInterval(() => {
            if (client.variables?.set) {
                client.variables.set('stats', {
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size,
                    channels: client.channels.cache.size,
                    commands: client.commands?.items?.size || 0,
                    events: client.events?.items?.size || 0,
                    uptime: client.uptime,
                    ping: client.ws.ping
                });
            }
        }, 60000);
    }
};
