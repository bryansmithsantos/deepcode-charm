# Documentation - DeepCode Framework v0.0.4

Welcome to the complete documentation for the DeepCode Charm Framework - the most powerful and flexible Discord bot framework with 50 essential primitive charms.

## 📚 Documentation Index

### 🚀 Getting Started
- **[Installation & Setup](./installation.md)** - Complete setup guide from zero to running bot
- **[API Documentation](./api.md)** - Full API reference and usage examples
- **[Migration Guide](./migration.md)** - Migrate from Discord.js, Aoi.js, BDFD, and others

### 📖 Reference Guides
- **[Complete Charm Reference](./charms-reference.md)** - All 50 charms documented with examples
- **[Examples Collection](../examples/)** - Real-world implementations and use cases

---

## 🎯 Quick Navigation

### For Beginners
1. **[Installation Guide](./installation.md)** - Start here if you're new
2. **[Basic Examples](../examples/basic/)** - Simple commands to get started
3. **[API Basics](./api.md#quick-start)** - Learn the fundamental concepts

### For Experienced Developers
1. **[Migration Guide](./migration.md)** - Convert from other frameworks
2. **[Advanced Examples](../examples/advanced/)** - Complex implementations
3. **[Complete Charm Reference](./charms-reference.md)** - All 50 charms detailed

### For Framework Contributors
1. **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute
2. **[Development Setup](./installation.md#development-setup)** - Local development
3. **[Architecture Overview](./api.md#architecture)** - Framework internals

---

## 🧩 Framework Overview

### What Makes DeepCode Different?

**Traditional frameworks give you pre-built features:**
```javascript
// Limited, can't customize
!economy balance
!economy work
!economy shop
```

**DeepCode gives you primitive building blocks:**
```javascript
// Unlimited possibilities
$data[get, user_coins_$$author]
$condition[$$data >= 100]
$data[subtract, user_coins_$$author, 100]
$embed[{ "title": "Custom Economy System" }]
```

### 50 Essential Charms

| Tier | Count | Purpose | Examples |
|------|-------|---------|----------|
| **Tier 1** | 20 | Basic Discord operations | `$say`, `$ban`, `$user`, `$embed` |
| **Tier 2** | 20 | Advanced server management | `$channel`, `$webhook`, `$audit`, `$button` |
| **Tier 3** | 10 | Complex logic & automation | `$condition`, `$schedule`, `$regex`, `$modal` |

---

## 🎨 What You Can Build

### 🏪 Complete Economy Systems
```javascript
// Dynamic shop with real-time pricing
$data[get, item_prices]
$math[multiply, $$data, $random[0.8, 1.2]]
$embed[{ "title": "🏪 Dynamic Market", "description": "Prices update every hour!" }]
```

### 🛡️ Advanced Moderation
```javascript
// Auto-moderation with custom rules
$trigger[create, {
    "name": "spam_detection",
    "condition": "message_count >= 5 && time_window <= 10s",
    "action": "$timeout[$$author, 10m, Auto-mod: Spam detected]"
}]
```

### 🎮 Interactive Games
```javascript
// Rock Paper Scissors with buttons
$button[row, [
    $button[{ "id": "rock", "label": "🪨 Rock", "style": "PRIMARY" }],
    $button[{ "id": "paper", "label": "📄 Paper", "style": "PRIMARY" }],
    $button[{ "id": "scissors", "label": "✂️ Scissors", "style": "PRIMARY" }]
]]
$wait[interaction, { "user": "$$author", "timeout": "30s" }]
```

### 📊 Analytics Dashboards
```javascript
// Server analytics with tracking
$track[stats, "message_sent", "24h"]
$track[stats, "user_join", "7d"]
$embed[{
    "title": "📊 Server Analytics",
    "fields": [
        { "name": "Messages (24h)", "value": "$$track", "inline": true },
        { "name": "New Members (7d)", "value": "$track[stats, user_join, 7d]", "inline": true }
    ]
}]
```

### 🎫 Ticket Systems
```javascript
// Support tickets with modal forms
$modal[create, {
    "id": "ticket_form",
    "title": "Create Support Ticket",
    "components": [
        $modal[field, { "id": "issue", "label": "Describe your issue", "style": "PARAGRAPH" }],
        $modal[field, { "id": "priority", "label": "Priority (1-5)", "style": "SHORT" }]
    ]
}]
```

### ⏰ Automated Systems
```javascript
// Scheduled announcements and tasks
$schedule[create, {
    "name": "daily_announcement",
    "cron": "0 9 * * *",  // 9 AM daily
    "command": "$say[🌅 Good morning everyone! Today's events: $$events]"
}]
```

---

## 🔧 Core Concepts

### 1. Charms are Primitives
Each charm does **one thing well** and can be combined infinitely:
```javascript
$user[$$mention, id]           // Get user ID
$data[get, user_level_$$user]  // Get their level
$condition[$$data >= 10]       // Check condition
$role[add, $$mention, VIP]     // Add VIP role
```

### 2. Context Variables
Access Discord data easily:
```javascript
$$author    // Message author ID
$$mention   // First mentioned user
$$args      // Command arguments
$$guild     // Server ID
$$channel   // Channel ID
$$ping      // Bot latency
```

### 3. Flexible Syntax
Multiple ways to use charms:
```javascript
// Simple format
$say[Hello World!]

// Object format
$embed[{ "title": "My Embed", "color": "BLUE" }]

// Nested charms
$say[Welcome $user[$$mention, username]!]
```

### 4. No Limits
Build anything you can imagine:
- Custom economy systems
- Advanced moderation bots
- Interactive games and polls
- Analytics and tracking
- Automation and scheduling
- Form-based workflows

---

## 📖 Documentation Structure

```
docs/
├── README.md              # This overview (you are here)
├── installation.md        # Complete setup guide
├── api.md                # Full API reference
├── charms-reference.md   # All 50 charms documented
└── migration.md          # Migration from other frameworks

examples/
├── basic/                # Simple examples for beginners
├── intermediate/         # Common use cases
├── advanced/            # Complex implementations
└── real-world/          # Production-ready examples
```

---

## 🚀 Getting Started Right Now

### 1. Install the Framework
```bash
npm install deepcode-framework
```

### 2. Create Your First Bot
```javascript
const { CharmClient } = require('deepcode-framework');

const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!',
    status: 'Ready to build anything!'
});

client.CharmRegisterCommand({
    name: 'hello',
    code: `$embed[{
        "title": "👋 Hello!",
        "description": "Welcome to DeepCode Framework!",
        "fields": [
            { "name": "Your ID", "value": "$$author", "inline": true },
            { "name": "Server", "value": "$server[name]", "inline": true }
        ],
        "color": "GREEN"
    }]`
});

client.login('YOUR_BOT_TOKEN');
```

### 3. Explore the Possibilities
- **[Browse Examples](../examples/)** - See what others have built
- **[Read the Charm Reference](./charms-reference.md)** - Learn all 50 charms

---

## 🤝 Community & Support


### Contribute
- **[Examples](../examples/)** - Share your implementations

### Stay Updated
- **[Changelog](../CHANGELOG.md)** - Latest changes and updates

---

## 🎯 Framework Philosophy

> **"Give developers primitives, not pre-built solutions"**

DeepCode believes in empowering developers with **building blocks** rather than limiting them with pre-built features. This approach ensures:

- ✅ **Unlimited Creativity** - Build exactly what you envision
- ✅ **Future-Proof** - Primitives never become obsolete
- ✅ **Complete Control** - No framework limitations
- ✅ **Easy Learning** - Master 50 primitives, build anything

---

**Ready to build the most powerful Discord bot ever created? Let's start! 🚀**

[**→ Start with Installation Guide**](./installation.md) | [**→ Browse Examples**](../examples/) | [**→ Join Community**](https://discord.gg/YOUR_INVITE)
