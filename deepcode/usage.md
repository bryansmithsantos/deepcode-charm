# DeepCode Usage Guide

## Basic Setup

```javascript
const { CharmClient } = require('deepcode-charm');

const client = new CharmClient({
    // Required intents for bot functionality
    intents: [
        'Guilds',               // Server events
        'GuildMembers',         // Member events
        'GuildMessages',        // Message events
        'MessageContent',       // Message content
        'GuildVoiceStates',    // Voice events
        'GuildPresences',      // User status
        'DirectMessages'        // DMs
    ],
    
    // Bot configuration
    prefix: '!',              // Command prefix
    debug: true,             // Debug logging
    token: 'YOUR_TOKEN',     // Discord bot token
    
    // Advanced options
    config: {
        // Bot status
        status: {
            text: 'with commands',
            type: 'PLAYING'    // PLAYING, WATCHING, LISTENING, COMPETING
        },
        
        // Variable persistence
        variables: {
            persist: true,
            path: './data/variables.json'
        },
        
        // Error reporting
        debugChannel: 'CHANNEL_ID',
        
        // Command settings
        commands: {
            cooldown: 3,
            caseSensitive: false,
            allowDMs: true
        }
    }
});
```

## Working with Commands

### Basic Commands

```javascript
// Simple response
client.commands.register({
    name: 'ping',
    description: 'Check bot latency',
    code: '$say[Pong! Latency: $$ping ms]'
});

// With arguments
client.commands.register({
    name: 'echo',
    usage: '<text>',
    code: '$say[$$args]'
});

// Using embeds
client.commands.register({
    name: 'info',
    code: '$embed[{' +
        '"title": "Server Info",' +
        '"description": "Information about $$guild.name",' +
        '"fields": [' +
            '{"name": "Members", "value": "$$guild.memberCount"},' +
            '{"name": "Channels", "value": "$$guild.channels.size"}' +
        '],' +
        '"color": "BLUE"' +
    '}]'
});
```

### Command Tiers & Features

#### Tier 1 - Basic Commands
```javascript
// Data storage
client.commands.register({
    name: 'points',
    tier: 1,
    code: 
        '$data[{' +
            'action: "add",' +
            'key: "user_$$author.points",' +
            'value: 5' +
        '}]' +
        '$say[You now have $$data[user_$$author.points] points!]'
});

// String manipulation
client.commands.register({
    name: 'format',
    tier: 1,
    code: 
        '$string[{' +
            'action: "case",' +
            'text: "$$args",' +
            'type: "title"' +
        '}]'
});
```

#### Tier 2 - Intermediate Commands
```javascript
// Interactive components
client.commands.register({
    name: 'poll',
    tier: 2,
    code: '$component[{' +
        'action: "create",' +
        'type: "button",' +
        'options: {' +
            'label: "Vote",' +
            'style: "PRIMARY",' +
            'customId: "vote_$$timestamp"' +
        '}' +
    '}]'
});

// Role management
client.commands.register({
    name: 'role',
    tier: 2,
    code: '$role[{' +
        'action: "add",' +
        'target: "$$mentions[0]",' +
        'roleId: "ROLE_ID"' +
    '}]'
});
```

#### Tier 3 - Advanced Commands
```javascript
// Permission system
client.commands.register({
    name: 'setup',
    tier: 3,
    code: '$permission[{' +
        'action: "grant",' +
        'roles: ["MOD_ROLE_ID"],' +
        'permissions: ["MANAGE_MESSAGES"],' +
        'channels: ["CHANNEL_ID"]' +
    '}]'
});

// Voice operations
client.commands.register({
    name: 'move',
    tier: 3,
    code: '$voice[{' +
        'action: "move",' +
        'users: "$$mentions",' +
        'channel: "CHANNEL_ID"' +
    '}]'
});
```

### Working with Variables

```javascript
// System variables
$$author         // Command author
$$channel        // Current channel
$$guild         // Current guild
$$message       // Command message
$$args          // Command arguments
$$prefix        // Command prefix
$$timestamp     // Current timestamp
$$random        // Random number
$$memberCount   // Guild member count
$$ping          // Bot latency

// Custom variables
$data[{action: "set", key: "counter", value: 1}]
$data[{action: "get", key: "counter"}]
$data[{action: "add", key: "counter", value: 1}]
$data[{action: "delete", key: "counter"}]
```

### Error Handling

```javascript
// Using condition charm
client.commands.register({
    name: 'admin',
    code: 
        '$condition[{' +
            'left: "$$author.permissions",' +
            'operator: "includes",' +
            'right: "ADMINISTRATOR",' +
            'then: "$say[Access granted]",' +
            'else: "$say[Access denied]"' +
        '}]'
});

// Try-catch with system charm
client.commands.register({
    name: 'risky',
    code: '$system[{' +
        'action: "exec",' +
        'command: {' +
            'code: "$someRiskyCharm[]",' +
            'onError: "$say[Error occurred: $$error]"' +
        '}' +
    '}]'
});
```

### Event Handling

```javascript
// Member join event
client.events.register({
    name: 'guildMemberAdd',
    execute: async (member) => {
        await member.guild.systemChannel?.send(
            `Welcome ${member} to the server!`
        );
    }
});

// Using charms in events
client.events.register({
    name: 'messageReactionAdd',
    code: '$condition[{' +
        'left: "$$reaction.emoji.name",' +
        'operator: "equals",' +
        'right: "⭐",' +
        'then: "$message[{' +
            'action: "pin",' +
            'messageId: "$$reaction.message.id"' +
        '}]"' +
    '}]'
});
```

### Advanced Features

#### Charm Chaining
```javascript
client.commands.register({
    name: 'profile',
    code: 
        // Update last seen
        '$data[{' +
            'action: "set",' +
            'key: "user_$$author.lastSeen",' +
            'value: "$$timestamp"' +
        '}]' +
        // Increment visits
        '$data[{' +
            'action: "add",' +
            'key: "user_$$author.visits",' +
            'value: 1' +
        '}]' +
        // Show profile
        '$embed[{' +
            'title: "Profile",' +
            'fields: [' +
                '{name: "Visits", value: "$$data[user_$$author.visits]"},' +
                '{name: "Last Seen", value: "$$data[user_$$author.lastSeen]"}' +
            ']' +
        '}]'
});
```

#### Custom Charm Creation
```javascript
// charms/custom.js
module.exports = {
    name: 'custom',
    description: 'Custom functionality',
    
    async execute(args, context) {
        const { action = 'default', options = {} } = args;
        
        switch (action) {
            case 'default':
                return 'Custom charm result';
                
            case 'special':
                // Special functionality
                break;
                
            default:
                throw new Error('Invalid action');
        }
    }
};
```

For more examples and detailed API documentation, check out:
- [Charm API](charms.md)
- [Advanced Topics](advanced.md)
- [Command Reference](commands.md)
