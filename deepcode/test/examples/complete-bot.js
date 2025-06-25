/**
 * Complete Bot Example - Shows comprehensive framework usage
 */
require('dotenv').config();
const { CharmClient } = require('../../');
const path = require('path');

// Create client instance
const client = new CharmClient({
    // Required intents
    intents: [
        'Guilds',
        'GuildMembers',
        'GuildMessages',
        'GuildMessageReactions',
        'GuildVoiceStates',
        'MessageContent',
        'DirectMessages'
    ],

    // Optional partials
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

    // Advanced options
    config: {
        // Bot status
        status: {
            text: 'with commands | !help',
            type: 'PLAYING',
            status: 'online'
        },

        // Command settings
        commands: {
            caseSensitive: false,
            allowDMs: true,
            cooldown: 3,
            directories: ['./commands']
        },

        // Variable persistence
        variables: {
            persist: true,
            path: path.join(__dirname, '../data/variables.json'),
            backupInterval: 300000
        },

        // Plugin options
        plugins: {
            automod: {
                enabled: true,
                config: {
                    filters: ['spam', 'invites', 'caps'],
                    actions: ['warn', 'delete', 'timeout']
                }
            },
            welcome: {
                enabled: true,
                config: {
                    channel: 'welcome',
                    message: 'Welcome {user} to {server}!'
                }
            }
        }
    }
});

// Register example commands
client.commands.register({
    name: 'echo',
    description: 'Echo a message',
    usage: '<text>',
    code: '$say[$$args]'
});

client.commands.register({
    name: 'profile',
    description: 'Show user profile',
    code: '$sequence[{' +
        '"actions": [' +
            // Get or create user data
            '$data[{' +
                'action: "get",' +
                'key: "profiles.$$author.id",' +
                'default: {' +
                    'points: 0,' +
                    'level: 1,' +
                    'messages: 0' +
                '}' +
            '}],' +
            // Create embed
            '$embed[{' +
                'title: "User Profile",' +
                'description: "Profile for $$author",' +
                'thumbnail: {"url": "$$author.avatarURL"},' +
                'fields: [' +
                    '{"name": "Level", "value": "$$data[profiles.$$author.id].level", "inline": true},' +
                    '{"name": "Points", "value": "$$data[profiles.$$author.id].points", "inline": true},' +
                    '{"name": "Messages", "value": "$$data[profiles.$$author.id].messages", "inline": true}' +
                '],' +
                'footer: {"text": "Join Date: $$member.joinedAt"},' +
                'color: "BLUE"' +
            '}]' +
        ']' +
    '}]'
});

// Register event handlers
client.events.register({
    name: 'messageCreate',
    code: '$condition[{' +
        '"left": "$$author.bot",' +
        '"operator": "equals",' +
        '"right": false,' +
        '"then": "$sequence[{' +
            '"actions": [' +
                // Update message count
                '$data[{' +
                    'action: "add",' +
                    'key: "profiles.$$author.id.messages",' +
                    'value: 1' +
                '}],' +
                // Add random points
                '$data[{' +
                    'action: "add",' +
                    'key: "profiles.$$author.id.points",' +
                    'value: "$$random[1,5]"' +
                '}],' +
                // Check for level up
                '$condition[{' +
                    'left: "$$data[profiles.$$author.id.points]",' +
                    'operator: "greater",' +
                    'right: "$$math[$$data[profiles.$$author.id.level] * 100]",' +
                    'then: "$sequence[{' +
                        'actions: [' +
                            // Increase level
                            '$data[{' +
                                'action: "add",' +
                                'key: "profiles.$$author.id.level",' +
                                'value: 1' +
                            '}],' +
                            // Send level up message
                            '$embed[{' +
                                'title: "Level Up!",' +
                                'description: "$$author leveled up to $$data[profiles.$$author.id.level]!",' +
                                'color: "GREEN"' +
                            '}]' +
                        ']' +
                    '}]"' +
                '}]' +
            ']' +
        '}]"' +
    '}]'
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Shutting down...');
    await client.variables.save();
    client.destroy();
    process.exit();
});

// Start bot
client.start(process.env.DISCORD_TOKEN).catch(console.error);
