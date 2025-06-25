require('dotenv').config();
const { CharmClient } = require('../');
const path = require('path');

async function startBot() {
    // Create client with full configuration
    const client = new CharmClient({
        // Required intents for full functionality
        intents: [
            'Guilds',
            'GuildMembers', 
            'GuildMessages',
            'GuildMessageReactions',
            'GuildVoiceStates',
            'MessageContent',
            'DirectMessages'
        ],

        // Optional partials for handling uncached data
        partials: [
            'Message',
            'Channel',
            'Reaction',
            'User',
            'GuildMember'
        ],

        // Bot configuration
        prefix: process.env.PREFIX || '!',
        debug: process.env.NODE_ENV !== 'production',
        token: process.env.DISCORD_TOKEN,

        // Advanced configuration
        config: {
            // Bot status
            status: {
                text: 'with Charms | !help',
                type: 'PLAYING',
                status: 'online'
            },

            // Variable persistence
            variables: {
                persist: true,
                path: path.join(__dirname, '../data/variables.json')
            },

            // Error reporting
            debugChannel: process.env.DEBUG_CHANNEL,

            // Command settings
            commands: {
                caseSensitive: false,
                allowDMs: true,
                cooldown: 3
            }
        }
    });

    // Register example commands
    client.commands.register({
        name: 'ping',
        description: 'Check bot latency',
        code: '$say[Pong! Latency: $$ping ms]'
    });

    client.commands.register({
        name: 'stats',
        description: 'Show bot stats',
        code: '$embed[{' +
            '"title": "Bot Stats",' +
            '"fields": [' +
                '{"name": "Guilds", "value": "$$guilds", "inline": true},' +
                '{"name": "Users", "value": "$$users", "inline": true},' +
                '{"name": "Commands", "value": "$$commands", "inline": true},' +
                '{"name": "Uptime", "value": "$$uptime", "inline": true},' +
                '{"name": "Memory", "value": "$$memory MB", "inline": true},' +
                '{"name": "Version", "value": "$$version", "inline": true}' +
            '],' +
            '"color": "BLUE",' +
            '"timestamp": true' +
        '}]'
    });

    // Register event handlers
    client.events.register({
        name: 'ready',
        once: true,
        execute() {
            console.log(`\nBot User: ${client.user.tag}`);
            console.log(`Guilds: ${client.guilds.cache.size}`);
            console.log(`Channels: ${client.channels.cache.size}`);
            console.log(`Users: ${client.users.cache.size}`);
            console.log(`Commands: ${client.commands.size}`);
            console.log(`Events: ${client.events.size}`);
            console.log(`Debug: ${client.debug}`);
            console.log(`Node: ${process.version}`);
            console.log(`Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n`);

            console.log('=== Available Commands ===\n');
            client.commands.forEach(cmd => {
                console.log(`${client.prefix}${cmd.name}`);
                console.log(`  ${cmd.description || 'No description'}\n`);
            });
            console.log('=========================\n');
        }
    });

    // Error handling
    process.on('unhandledRejection', error => {
        console.error('Unhandled promise rejection:', error);
    });

    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT. Shutting down...');
        client.stop();
    });

    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM. Shutting down...');
        client.stop();
    });

    // Start bot
    try {
        await client.start();
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Run bot
startBot().catch(console.error);
