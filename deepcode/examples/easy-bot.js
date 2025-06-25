const { CharmClient } = require('../index');

// Create client with simplified configuration
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!',
    debug: true,
    config: {
        status: ['Playing with charms', 'PLAYING'],  // Simplified status config
        variables: {
            persist: true
        }
    }
});

// Easy command registration with template literals
client.CharmRegisterCommand({
    name: 'ping',
    description: 'Check bot latency',
    code: `$say[🏓 Pong! Latency: $$ping ms]`
});

client.CharmRegisterCommand({
    name: 'hello',
    description: 'Say hello to someone',
    usage: '@user',
    aliases: ['hi', 'hey'],
    code: `$say[Hello $$mention! 👋]`
});

client.CharmRegisterCommand({
    name: 'serverinfo',
    description: 'Get server information',
    code: `$embed[{
        "title": "📊 Server Info",
        "description": "Information about **$$guild.name**",
        "fields": [
            {"name": "👥 Members", "value": "$$guild.memberCount", "inline": true},
            {"name": "📝 Channels", "value": "$$guild.channels.size", "inline": true},
            {"name": "🎭 Roles", "value": "$$guild.roles.size", "inline": true},
            {"name": "📅 Created", "value": "$$guild.createdAt", "inline": false}
        ],
        "color": "BLUE",
        "thumbnail": {"url": "$$guild.iconURL"}
    }]`
});

client.CharmRegisterCommand({
    name: 'userinfo',
    description: 'Get user information',
    usage: '@user',
    aliases: ['ui', 'whois'],
    code: `$embed[{
        "title": "👤 User Info",
        "description": "Information about $$mention",
        "fields": [
            {"name": "🆔 ID", "value": "$$author.id", "inline": true},
            {"name": "📅 Account Created", "value": "$$author.createdAt", "inline": true},
            {"name": "📅 Joined Server", "value": "$$author.joinedAt", "inline": true},
            {"name": "🎭 Roles", "value": "$$author.roles.size", "inline": true}
        ],
        "color": "GREEN",
        "thumbnail": {"url": "$$author.avatarURL"}
    }]`
});

client.CharmRegisterCommand({
    name: 'say',
    description: 'Make the bot say something',
    usage: '<message>',
    permissions: ['MANAGE_MESSAGES'],
    code: `$say[$$args]`
});

client.CharmRegisterCommand({
    name: 'embed',
    description: 'Send a custom embed',
    usage: '<title> | <description>',
    code: `$embed[{
        "title": "$$args[0]",
        "description": "$$args[1]",
        "color": "RANDOM"
    }]`
});

// Load additional commands from files (if they exist)
client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} is ready!`);
    
    // Try to load commands from directory
    try {
        await client.CharmCommander('commands');
        console.log('📁 Additional commands loaded from directory');
    } catch (error) {
        console.log('📁 No additional commands directory found (this is okay)');
    }
});

// Start the bot
client.start(process.env.DISCORD_TOKEN || 'YOUR_TOKEN_HERE');
