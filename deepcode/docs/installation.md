# Installation & Setup - DeepCode Framework v0.0.5

Complete guide to install and set up the DeepCode Charm Framework.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [CLI Tools](#cli-tools)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### System Requirements
- **Node.js**: 16.9.0 or higher
- **npm**: 7.0.0 or higher (or yarn/pnpm equivalent)
- **Discord Bot Token**: [Create a bot application](https://discord.com/developers/applications)

### Recommended
- **TypeScript**: For enhanced development experience
- **Git**: For version control
- **Code Editor**: VS Code with Discord.js extension

---

## Installation

### Method 1: NPM (Recommended)

```bash
# Install globally for CLI access
npm install -g deepcode-framework

# Or install locally in your project
npm install deepcode-framework
```

### Method 2: Yarn

```bash
# Install globally
yarn global add deepcode-framework

# Or install locally
yarn add deepcode-framework
```

### Method 3: PNPM

```bash
# Install globally
pnpm add -g deepcode-framework

# Or install locally
pnpm add deepcode-framework
```

---

## Quick Start

### 1. Create New Project

```bash
# Using CLI (if installed globally)
deepcode init my-discord-bot

# Or manually create directory
mkdir my-discord-bot
cd my-discord-bot
npm init -y
npm install deepcode-framework
```

### 2. Basic Bot Setup

Create `index.js`:

```javascript
const { CharmClient } = require('deepcode-framework');

const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!',
    status: 'Playing with 50 charms!'
});

// Basic commands
client.CharmRegisterCommand({
    name: 'ping',
    code: `$embed[{
        "title": "🏓 Pong!",
        "fields": [
            { "name": "Latency", "value": "$$ping ms", "inline": true },
            { "name": "Uptime", "value": "$time[format, $$uptime, duration]", "inline": true }
        ],
        "color": "GREEN"
    }]`
});

client.CharmRegisterCommand({
    name: 'help',
    code: `$embed[{
        "title": "🤖 Bot Commands",
        "description": "Available commands:",
        "fields": [
            { "name": "!ping", "value": "Check bot latency", "inline": false },
            { "name": "!help", "value": "Show this help message", "inline": false }
        ],
        "color": "BLUE"
    }]`
});

// Auto-load commands from directory (optional)
client.CharmCommander('commands').catch(console.error);

// Login
client.login('YOUR_BOT_TOKEN');
```

### 3. Environment Setup

Create `.env` file:

```env
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
NODE_ENV=development
```

Update `index.js` to use environment variables:

```javascript
require('dotenv').config();

const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: process.env.PREFIX || '!',
    status: 'Ready to serve!'
});

// ... rest of your code

client.login(process.env.DISCORD_TOKEN);
```

### 4. Run Your Bot

```bash
node index.js
```

---

## Project Structure

### Recommended Structure

```
my-discord-bot/
├── commands/           # Command files (auto-loaded)
│   ├── moderation/
│   │   ├── ban.js
│   │   ├── kick.js
│   │   └── timeout.js
│   ├── utility/
│   │   ├── ping.js
│   │   ├── help.js
│   │   └── userinfo.js
│   └── economy/
│       ├── balance.js
│       ├── work.js
│       └── shop.js
├── events/             # Custom event handlers
│   ├── ready.js
│   └── messageCreate.js
├── data/               # Data storage (auto-created)
│   ├── users/
│   └── guilds/
├── config/             # Configuration files
│   ├── bot.json
│   └── database.json
├── logs/               # Log files (auto-created)
├── .env                # Environment variables
├── .gitignore
├── package.json
└── index.js            # Main bot file
```

### Command File Example

Create `commands/utility/ping.js`:

```javascript
module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    category: 'utility',
    cooldown: 3000,
    code: `$embed[{
        "title": "🏓 Pong!",
        "fields": [
            { "name": "Latency", "value": "$$ping ms", "inline": true },
            { "name": "API Latency", "value": "$math[subtract, $time[now], $$timestamp] ms", "inline": true }
        ],
        "color": "GREEN",
        "timestamp": true
    }]`
};
```

---

## Configuration

### Client Configuration

```javascript
const client = new CharmClient({
    // Required
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    
    // Optional
    prefix: '!',                    // Command prefix
    status: 'Playing with charms',  // Bot status
    allowedMentions: {              // Mention settings
        parse: ['users', 'roles'],
        repliedUser: false
    },
    partials: ['MESSAGE', 'CHANNEL'], // Discord partials
    
    // Advanced
    shards: 'auto',                 // Sharding (for large bots)
    shardCount: 1,
    restTimeOffset: 0,
    restRequestTimeout: 15000,
    
    // DeepCode specific
    dataDirectory: './data',        // Data storage location
    logLevel: 'info',              // Logging level
    autoSave: true,                // Auto-save data
    autoSaveInterval: 300000       // Auto-save interval (5 minutes)
});
```

### Environment Variables

```env
# Required
DISCORD_TOKEN=your_bot_token_here

# Optional
PREFIX=!
NODE_ENV=production
LOG_LEVEL=info
DATA_DIRECTORY=./data
AUTO_SAVE=true
AUTO_SAVE_INTERVAL=300000

# Database (if using external database)
DATABASE_URL=mongodb://localhost:27017/mybot
REDIS_URL=redis://localhost:6379

# API Keys (for external services)
WEATHER_API_KEY=your_weather_api_key
TRANSLATE_API_KEY=your_translate_api_key
```

---

## CLI Tools

### Available Commands

```bash
# Initialize new project
deepcode init <project-name>

# Create new command
deepcode command <command-name> --category=utility

# Create new charm
deepcode charm <charm-name> --tier=2

# Generate documentation
deepcode docs --watch

# Start development server
deepcode dev

# Build for production
deepcode build

# Deploy to hosting service
deepcode deploy --service=heroku
```

### CLI Examples

```bash
# Create a new moderation bot
deepcode init moderation-bot --template=moderation

# Create a new economy command
deepcode command shop --category=economy --description="Server shop system"

# Generate and serve documentation
deepcode docs --serve --port=3000

# Start development with hot reload
deepcode dev --watch --port=3001
```

---

## Troubleshooting

### Common Issues

#### 1. Bot Not Responding

**Problem**: Bot is online but doesn't respond to commands.

**Solutions**:
```javascript
// Check intents
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'], // MessageContent is required
    prefix: '!'
});

// Check permissions
// Bot needs "Send Messages" and "Read Message History" permissions
```

#### 2. Permission Errors

**Problem**: "Missing Permissions" errors.

**Solutions**:
```javascript
// Add permission checks
client.CharmRegisterCommand({
    name: 'ban',
    permissions: ['BAN_MEMBERS'], // Required permissions
    code: `
        $condition[$member[$$author, permissions].includes('BAN_MEMBERS') == false]
            $say[❌ You don't have permission!]
            $return
        $ban[$$mention, $$args]
    `
});
```

#### 3. Data Not Persisting

**Problem**: User data resets on bot restart.

**Solutions**:
```javascript
// Enable auto-save
const client = new CharmClient({
    autoSave: true,
    autoSaveInterval: 60000, // Save every minute
    dataDirectory: './data'  // Ensure directory exists
});

// Manual save
$data[save] // Force save all data
```

#### 4. High Memory Usage

**Problem**: Bot uses too much memory.

**Solutions**:
```javascript
// Use caching with TTL
$cache[set, { "key": "expensive_data", "value": "$$data", "ttl": 300 }]

// Clear unused data
$data[cleanup] // Remove expired data

// Use pagination for large datasets
$array[slice, $$largeArray, 0, 10] // Show only first 10 items
```

#### 5. Rate Limiting

**Problem**: Bot gets rate limited by Discord.

**Solutions**:
```javascript
// Add cooldowns
client.CharmRegisterCommand({
    name: 'spam-prone-command',
    cooldown: 5000, // 5 second cooldown
    code: `$say[Command executed!]`
});

// Batch operations
$array[create, $$user1, $$user2, $$user3]
$loop[$$array]
    $role[add, $$item, Member]
    $wait[100ms] // Small delay between operations
```

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const client = new CharmClient({
    logLevel: 'debug',
    debug: true
});

// Or via environment
process.env.LOG_LEVEL = 'debug';
process.env.DEBUG = 'true';
```

### Getting Help

1. **Check Documentation**: [API Reference](./api.md)
2. **Search Examples**: [Examples Directory](../examples/)
3. **Discord Community**: [Join our server](https://discord.gg/YOUR_INVITE)
4. **GitHub Issues**: [Report bugs](https://github.com/your-username/deepcode-framework/issues)
5. **Stack Overflow**: Tag your questions with `deepcode-framework`

---

## Next Steps

1. **Read the Documentation**: [Complete Charm Reference](./charms-reference.md)
2. **Explore Examples**: [Practical Examples](../examples/)
3. **Join the Community**: [Discord Server](https://discord.gg/YOUR_INVITE)
4. **Build Something Amazing**: The 50 charms are your building blocks!

---

**Ready to build the most powerful Discord bot ever? Let's go! 🚀**
