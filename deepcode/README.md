# 🚀 DeepCode Charm Framework v0.0.4-alpha-04

**The most powerful and flexible Discord bot framework - 50 ESSENTIAL PRIMITIVES IN DEVELOPMENT!**

DeepCode revolutionizes Discord bot development by providing **50 essential primitive charms** instead of pre-built features. This gives you unlimited freedom to create exactly what you want, how you want it.

[![npm version](https://badge.fury.io/js/deepcode-charm.svg)](https://badge.fury.io/js/deepcode-charm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/bryansmithsantos/deepcode-charm?style=social)](https://github.com/bryansmithsantos/deepcode-charm)

## 🎯 **Why DeepCode?**

### **❌ Traditional Frameworks:**
- ❌ Limited pre-built commands
- ❌ Rigid structure you can't change
- ❌ "Take it or leave it" functionality
- ❌ Can't build unique features

### **✅ DeepCode Framework:**
- ✅ **50 primitive charms** (building blocks)
- ✅ **Unlimited combinations** possible
- ✅ **Build anything** you can imagine
- ✅ **Your creativity** is the only limit

---

## 🧩 **What are Charms?**

Charms are **primitive building blocks** that give you direct access to Discord's API and essential functionality. Instead of giving you a pre-built "economy system", we give you the primitives to build **your own unique economy system**.

### **Example: Building a Custom Economy**

```javascript
// Traditional framework: Limited pre-built economy
!shop buy sword    // Fixed functionality, can't customize

// DeepCode: Build your own with primitives
$data[get, user_coins_$$author]
$condition[$$data >= 100]
$data[subtract, user_coins_$$author, 100]
$data[add, user_items_$$author, legendary_sword]
$embed[{
    "title": "⚔️ Purchase Successful!",
    "description": "You bought a Legendary Sword for 100 coins!",
    "color": "GOLD"
}]
```

---

## 📊 **Framework Overview**

### **🎯 Current Status: v0.0.4-alpha-03 - IN DEVELOPMENT**
- 🔄 **50 Essential Charms** being implemented (work in progress)
- ✅ **3-Tier System** architecture defined
- 🔄 **Alpha Testing** phase - core functionality working
- 🔄 **Discord API Coverage** expanding with each release

### **🔧 Complete Tier System**

| Tier | Charms | Description | Examples |
|------|--------|-------------|----------|
| **Tier 1** | 20 charms | Basic primitives | `$say`, `$embed`, `$ban`, `$avatar`, `$ping` |
| **Tier 2** | 20 charms | Intermediate operations | `$channel`, `$webhook`, `$audit`, `$button` |
| **Tier 3** | 10 charms | Advanced logic & control | `$condition`, `$schedule`, `$regex`, `$modal` |

---

## 🚀 **Quick Start**

### **Installation**

```bash
npm install deepcode-charm
# or
yarn add deepcode-charm
# or
pnpm add deepcode-charm
```

### **Basic Setup**

```javascript
const { CharmClient } = require('deepcode-charm');

const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!',
    status: 'Playing with 50 charms!'
});

// Easy command registration
client.CharmRegisterCommand({
    name: 'ping',
    code: `$say[🏓 Pong! Latency: $$ping ms]`
});

client.CharmRegisterCommand({
    name: 'userinfo',
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

// Auto-load commands from directory
await client.CharmCommander('commands');

client.login('YOUR_BOT_TOKEN');
```

---

## 🎨 **What You Can Build**

With 50 primitive charms, you can create **literally anything**:

### **🏪 Advanced Economy Systems**
```javascript
// Custom shop with dynamic pricing
$data[get, item_prices]
$math[multiply, $$data, $random[0.8, 1.2]]  // Dynamic pricing
$embed[{ "title": "🏪 Dynamic Shop", "description": "Prices change every hour!" }]
```

### **🎮 Interactive Games**
```javascript
// Rock Paper Scissors with buttons
$button[{ "id": "rock", "label": "🪨 Rock", "style": "PRIMARY" }]
$button[{ "id": "paper", "label": "📄 Paper", "style": "PRIMARY" }]
$button[{ "id": "scissors", "label": "✂️ Scissors", "style": "PRIMARY" }]
$wait[interaction, { "user": "$$author", "timeout": "30s" }]
```

### **🛡️ Advanced Moderation**
```javascript
// Auto-moderation with custom triggers
$trigger[create, {
    "name": "spam_detection",
    "condition": "message_count >= 5 && time_window <= 10s",
    "action": "$timeout[$$author, 10m, Spam detected]"
}]
```

### **📊 Analytics & Tracking**
```javascript
// Track user activity
$track[event, { "name": "command_used", "user": "$$author", "command": "$$command" }]
$track[stats, "command_used"]  // Get usage statistics
```

### **🎫 Ticket Systems**
```javascript
// Create ticket with modal form
$modal[create, {
    "id": "ticket_form",
    "title": "Create Support Ticket",
    "components": [
        $modal[field, { "id": "issue", "label": "Describe your issue", "style": "PARAGRAPH" }]
    ]
}]
```

### **⏰ Automated Tasks**
```javascript
// Schedule daily announcements
$schedule[create, {
    "name": "daily_announcement",
    "cron": "0 9 * * *",  // 9 AM daily
    "command": "$say[🌅 Good morning everyone!]"
}]
```

---

## 📚 **Complete Charm Reference**

### **Tier 1 - Basic Primitives (20 charms)**

#### **🔍 Information (6 charms)**
- `$avatar` - Get user/server avatars
- `$user` - User information and data
- `$server` - Server information and stats
- `$mention` - Handle and validate mentions
- `$ping` - Bot latency and connection status
- `$uptime` - Bot uptime information

#### **🛡️ Moderation (7 charms)**
- `$ban` - Ban users from server
- `$kick` - Kick users from server
- `$timeout` - Discord native timeout
- `$mute` / `$unmute` - Role-based muting
- `$warn` - Warning system
- `$purge` - Bulk message deletion
- `$slowmode` - Configure channel slowmode

#### **💬 Communication (4 charms)**
- `$say` - Send simple messages
- `$embed` - Create rich embeds
- `$dm` - Send direct messages
- `$reply` - Reply to messages

#### **🔧 Utilities (3 charms)**
- `$random` - Random numbers and choices
- `$math` - Mathematical operations
- `$time` - Time and date manipulation

### **Tier 2 - Intermediate Primitives (20 charms)**

#### **📋 Server Management (8 charms)**
- `$channel` - CRUD operations for channels
- `$role` - CRUD operations for roles
- `$member` - Member management
- `$permission` - Permission management
- `$invite` - Invite management
- `$emoji` - Custom emoji management
- `$webhook` - Webhook operations
- `$category` - Channel category management

#### **🗄️ Data & Persistence (4 charms)**
- `$data` - Variable storage and persistence
- `$json` - JSON data manipulation
- `$file` - File operations
- `$cache` - Memory caching with TTL

#### **📊 Logging & Analytics (4 charms)**
- `$log` - Logging system with levels
- `$audit` - Discord audit log access
- `$track` - Event tracking and analytics
- `$history` - Message history operations

#### **🔗 Interactions (4 charms)**
- `$button` - Interactive buttons
- `$select` - Selection menus
- `$modal` - Modal forms
- `$reaction` - Reaction management

### **Tier 3 - Advanced Primitives (10 charms)**

#### **🔄 Flow Control (6 charms)**
- `$condition` - Conditional logic
- `$loop` - Loops and iterations
- `$wait` - Delays and waiting
- `$schedule` - Task scheduling
- `$event` - Event management
- `$trigger` - Conditional triggers

#### **📊 Data Manipulation (4 charms)**
- `$array` - Array operations
- `$string` - String manipulation
- `$regex` - Regular expressions
- `$validate` - Data validation

---

## 🛠️ **Advanced Features**

### **Easy Command Registration**
```javascript
// Multiple ways to register commands
client.CharmRegisterCommand({
    name: 'profile',
    code: `$embed[{ "title": "$user[$$author, tag]'s Profile" }]`
});

// Template literals support
client.CharmRegisterCommand({
    name: 'welcome',
    code: `$say[Welcome $mention[$$author] to our server! 🎉]`
});
```

### **Automatic Command Loading**
```javascript
// Load all commands from directory
await client.CharmCommander('commands');

// Custom directory
await client.CharmCommander('my-custom-commands');
```

### **Flexible Configuration**
```javascript
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages'],
    prefix: '!',
    status: ['Playing with charms', 'PLAYING'],  // [text, type]
    // or simply: status: 'Playing with charms'
});
```

---

## 📖 **Documentation**

- **[Complete Charm Reference](./docs/charms-reference.md)** - All 50 charms documented
- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Examples](./examples/)** - Practical examples and use cases
- **[Migration Guide](./docs/migration.md)** - Upgrading from other frameworks

---
---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
---


**Built with ❤️ by the DeepCode team. Empowering developers to create unlimited Discord bot experiences.**
