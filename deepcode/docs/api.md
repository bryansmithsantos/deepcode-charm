# API Documentation - DeepCode Framework v0.0.5

Complete API reference for the DeepCode Charm Framework.

## Table of Contents

- [Client Setup](#client-setup)
- [Command Registration](#command-registration)
- [Charm Syntax](#charm-syntax)
- [Context Variables](#context-variables)
- [Error Handling](#error-handling)
- [Advanced Features](#advanced-features)

---

## Client Setup

### CharmClient Constructor

```javascript
const { CharmClient } = require('deepcode-framework');

const client = new CharmClient(options);
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `intents` | Array | `['Guilds', 'GuildMessages']` | Discord gateway intents |
| `prefix` | String | `'!'` | Command prefix |
| `status` | String/Array | `'Ready'` | Bot status (text or [text, type]) |
| `allowedMentions` | Object | `{ parse: [] }` | Discord allowed mentions |
| `partials` | Array | `[]` | Discord partials |

#### Examples

```javascript
// Basic setup
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!',
    status: 'Playing with 50 charms!'
});

// Advanced setup
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent', 'GuildMembers'],
    prefix: ['!', '?', '.'],  // Multiple prefixes
    status: ['Watching the server', 'WATCHING'],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false
    }
});
```

---

## Command Registration

### CharmRegisterCommand

Register individual commands with charm code.

```javascript
client.CharmRegisterCommand(commandOptions);
```

#### Command Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | String | ✅ | Command name |
| `code` | String | ✅ | Charm code to execute |
| `description` | String | ❌ | Command description |
| `aliases` | Array | ❌ | Command aliases |
| `cooldown` | Number | ❌ | Cooldown in milliseconds |
| `permissions` | Array | ❌ | Required permissions |
| `category` | String | ❌ | Command category |

#### Examples

```javascript
// Simple command
client.CharmRegisterCommand({
    name: 'ping',
    code: `$say[🏓 Pong! Latency: $$ping ms]`
});

// Advanced command
client.CharmRegisterCommand({
    name: 'userinfo',
    description: 'Get user information',
    aliases: ['ui', 'whois'],
    cooldown: 5000,
    permissions: ['SendMessages'],
    category: 'utility',
    code: `$embed[{
        "title": "User Information",
        "thumbnail": { "url": "$avatar[$$mention]" },
        "fields": [
            { "name": "Username", "value": "$user[$$mention, tag]", "inline": true },
            { "name": "ID", "value": "$user[$$mention, id]", "inline": true },
            { "name": "Joined", "value": "$user[$$mention, joined]", "inline": true }
        ],
        "color": "BLUE"
    }]`
});
```

### CharmCommander

Automatically load commands from a directory.

```javascript
await client.CharmCommander(directory);
```

#### Examples

```javascript
// Load from default 'commands' directory
await client.CharmCommander();

// Load from custom directory
await client.CharmCommander('my-commands');

// Load with options
await client.CharmCommander('commands', {
    recursive: true,
    extensions: ['.js', '.json'],
    ignore: ['disabled', 'test']
});
```

---

## Charm Syntax

### Basic Syntax

```javascript
$charmName[arguments]
```

### Argument Types

#### String Arguments
```javascript
$say[Hello World!]
$ban[$$mention, Spamming]
```

#### Object Arguments
```javascript
$embed[{
    "title": "My Embed",
    "description": "This is a description",
    "color": "BLUE"
}]
```

#### Array Arguments
```javascript
$random[option1, option2, option3]
$array[create, item1, item2, item3]
```

### Nested Charms

```javascript
$embed[{
    "title": "$user[$$author, username]'s Profile",
    "description": "User has $data[get, user_points_$$author] points",
    "color": "$condition[$$data > 100, GREEN, RED]"
}]
```

### Conditional Execution

```javascript
$condition[$$args == admin]
$role[add, $$author, Admin Role]
$say[You are now an admin!]
```

---

## Context Variables

### User Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$$author` | Message author ID | `123456789012345678` |
| `$$mention` | First mentioned user | `123456789012345678` |
| `$$mentions` | All mentioned users | `[123..., 456...]` |
| `$$args` | Command arguments | `hello world` |
| `$$arg[n]` | Specific argument | `$$arg[1]` = first arg |

### Server Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$$guild` | Guild ID | `123456789012345678` |
| `$$channel` | Channel ID | `123456789012345678` |
| `$$message` | Message ID | `123456789012345678` |
| `$$prefix` | Used prefix | `!` |
| `$$command` | Command name | `ping` |

### Bot Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$$bot` | Bot user ID | `123456789012345678` |
| `$$ping` | Bot latency | `45` |
| `$$uptime` | Bot uptime | `3600000` |

### Dynamic Variables

```javascript
// Store and retrieve custom data
$data[set, user_level_$$author, 5]
$data[get, user_level_$$author]  // Returns: 5

// Use in conditions
$condition[$data[get, user_level_$$author] >= 10]
$say[You are high level!]
```

---

## Error Handling

### Try-Catch Pattern

```javascript
$condition[true]
    $data[get, user_coins_$$author]
    $condition[$$data >= 100]
        $data[subtract, user_coins_$$author, 100]
        $say[Purchase successful!]
    $else
        $say[Insufficient coins! You need 100 coins.]
$catch
    $say[An error occurred while processing your purchase.]
```

### Validation

```javascript
// Validate user input
$validate[$$args, number]
$condition[$$validate == true]
    $math[add, $$args, 10]
    $say[Result: $$math]
$else
    $say[Please provide a valid number!]
```

### Error Messages

```javascript
// Custom error handling
$condition[$user[$$mention, exists] == false]
    $say[❌ User not found!]
    $return

$condition[$member[$$mention, permissions].includes('ADMINISTRATOR') == false]
    $say[❌ User is not an administrator!]
    $return

$say[✅ User is valid and has permissions!]
```

---

## Advanced Features

### Loops and Iterations

```javascript
// Loop through array
$array[create, apple, banana, orange]
$loop[$$array]
    $say[Fruit: $$item]

// Loop with conditions
$loop[1, 10]
    $condition[$$index % 2 == 0]
        $say[Even number: $$index]
```

### Event Handling

```javascript
// Listen to Discord events
$event[listen, {
    "event": "guildMemberAdd",
    "action": "$say[Welcome $$user to the server!]"
}]

// Custom events
$event[emit, {
    "name": "user_level_up",
    "data": { "user": "$$author", "level": 10 }
}]
```

### Scheduled Tasks

```javascript
// Daily announcement
$schedule[create, {
    "name": "daily_announcement",
    "cron": "0 9 * * *",
    "command": "$say[🌅 Good morning everyone!]"
}]

// One-time reminder
$schedule[once, {
    "delay": "1h",
    "command": "$dm[$$author, Don't forget about the meeting!]"
}]
```

### Interactive Components

```javascript
// Create buttons
$button[row, [
    $button[{ "id": "yes", "label": "Yes", "style": "SUCCESS" }],
    $button[{ "id": "no", "label": "No", "style": "DANGER" }]
]]

// Wait for interaction
$wait[interaction, { "user": "$$author", "timeout": "30s" }]
$condition[$$interaction.customId == "yes"]
    $say[You clicked Yes!]
$else
    $say[You clicked No!]
```

### Modal Forms

```javascript
// Create modal
$modal[create, {
    "id": "feedback_form",
    "title": "Feedback Form",
    "components": [
        $modal[field, { "id": "rating", "label": "Rating (1-10)", "style": "SHORT" }],
        $modal[field, { "id": "comments", "label": "Comments", "style": "PARAGRAPH" }]
    ]
}]

// Show modal
$modal[show, { "modal": "$$modal", "interaction": "$$interaction" }]
```

---

## Performance Tips

### Efficient Data Access

```javascript
// Good: Store frequently accessed data
$data[set, guild_config_$$guild, { "prefix": "!", "welcome": true }]
$data[get, guild_config_$$guild]

// Avoid: Repeated API calls
$server[name]  // API call
$server[name]  // Another API call
```

### Caching

```javascript
// Cache expensive operations
$cache[set, { "key": "user_stats_$$author", "value": "$$stats", "ttl": 300 }]
$cache[get, "user_stats_$$author"]
```

### Batch Operations

```javascript
// Good: Batch role assignments
$array[create, $$mention1, $$mention2, $$mention3]
$loop[$$array]
    $role[add, $$item, "Member"]

// Avoid: Individual operations in separate commands
```

---

## Migration from Other Frameworks

### From Discord.js

```javascript
// Discord.js
message.channel.send('Hello!');
message.member.roles.add(role);

// DeepCode
$say[Hello!]
$role[add, $$author, $$role]
```

### From Aoi.js

```javascript
// Aoi.js
$sendMessage[Hello World!]
$giveRole[$authorID;$findRole[Member]]

// DeepCode
$say[Hello World!]
$role[add, $$author, Member]
```

### From BDFD

```javascript
// BDFD
$sendMessage[Hello!]
$giveRole[$authorID;$roleID[Member]]

// DeepCode
$say[Hello!]
$role[add, $$author, Member]
```
