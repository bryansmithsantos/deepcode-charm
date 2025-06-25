# Migration Guide - DeepCode Framework v0.0.4

Complete guide for migrating from other Discord bot frameworks to DeepCode.

## Table of Contents

- [From Discord.js](#from-discordjs)
- [From Aoi.js](#from-aoijs)
- [From BDFD](#from-bdfd)
- [From Eris](#from-eris)
- [From Commando](#from-commando)
- [General Migration Tips](#general-migration-tips)

---

## From Discord.js

### Basic Setup Migration

**Discord.js:**
```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

client.on('messageCreate', message => {
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.login('token');
```

**DeepCode:**
```javascript
const { CharmClient } = require('deepcode-framework');
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!'
});

client.CharmRegisterCommand({
    name: 'ping',
    code: `$reply[Pong!]`
});

client.login('token');
```

### Command Handling Migration

**Discord.js:**
```javascript
client.on('messageCreate', async message => {
    if (message.content.startsWith('!ban')) {
        const user = message.mentions.users.first();
        const reason = message.content.split(' ').slice(2).join(' ');
        
        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.reply('No permission!');
        }
        
        await message.guild.members.ban(user, { reason });
        message.reply(`Banned ${user.tag}`);
    }
});
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'ban',
    code: `
        $condition[$member[$$author, permissions].includes('BAN_MEMBERS') == false]
            $reply[❌ You don't have permission to ban members!]
            $return

        $ban[$$mention, $$args]
        $reply[✅ Banned $user[$$mention, tag]]
    `
});
```

### Embed Creation Migration

**Discord.js:**
```javascript
const { EmbedBuilder } = require('discord.js');

const embed = new EmbedBuilder()
    .setTitle('User Info')
    .setDescription(`Info for ${user.tag}`)
    .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Joined', value: member.joinedAt.toDateString(), inline: true }
    )
    .setColor('Blue')
    .setThumbnail(user.displayAvatarURL());

message.reply({ embeds: [embed] });
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'userinfo',
    code: `$embed[{
        "title": "User Info",
        "description": "Info for $user[$$mention, tag]",
        "fields": [
            { "name": "ID", "value": "$user[$$mention, id]", "inline": true },
            { "name": "Joined", "value": "$time[format, $user[$$mention, joinedAt], date]", "inline": true }
        ],
        "color": "BLUE",
        "thumbnail": { "url": "$avatar[$$mention]" }
    }]`
});
```

---

## From Aoi.js

### Basic Command Migration

**Aoi.js:**
```javascript
bot.command({
    name: "ping",
    code: `$sendMessage[Pong! $pingms]`
});

bot.command({
    name: "avatar",
    code: `$sendMessage[$userAvatar[$authorID]]`
});
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'ping',
    code: `$say[Pong! $$ping ms]`
});

client.CharmRegisterCommand({
    name: 'avatar',
    code: `$say[$avatar[$$author]]`
});
```

### Variable System Migration

**Aoi.js:**
```javascript
bot.command({
    name: "balance",
    code: `$sendMessage[You have $getVar[coins;$authorID] coins]`
});

bot.command({
    name: "work",
    code: `
        $setVar[coins;$sum[$getVar[coins;$authorID];$random[10;50]];$authorID]
        $sendMessage[You earned $random[10;50] coins!]
    `
});
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'balance',
    code: `$say[You have $data[get, user_coins_$$author] coins]`
});

client.CharmRegisterCommand({
    name: 'work',
    code: `
        $random[10, 50]
        $data[add, user_coins_$$author, $$random]
        $say[You earned $$random coins!]
    `
});
```

### Conditional Logic Migration

**Aoi.js:**
```javascript
bot.command({
    name: "buy",
    code: `
        $if[$getVar[coins;$authorID]>=100]
            $setVar[coins;$sub[$getVar[coins;$authorID];100];$authorID]
            $sendMessage[Purchase successful!]
        $else
            $sendMessage[Not enough coins!]
        $endif
    `
});
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'buy',
    code: `
        $data[get, user_coins_$$author]
        $condition[$$data >= 100]
            $data[subtract, user_coins_$$author, 100]
            $say[Purchase successful!]
        $else
            $say[Not enough coins!]
    `
});
```

---

## From BDFD

### Basic Command Migration

**BDFD:**
```javascript
$nomention
$sendMessage[Pong! $ping ms]
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'ping',
    code: `$say[Pong! $$ping ms]`
});
```

### Role Management Migration

**BDFD:**
```javascript
$giveRole[$authorID;$roleID[Member]]
$sendMessage[Role given!]
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'giverole',
    code: `
        $role[add, $$author, Member]
        $say[Role given!]
    `
});
```

### Economy System Migration

**BDFD:**
```javascript
$setUserVar[money;$sum[$getUserVar[money];$random[10;50]]]
$sendMessage[You earned $random[10;50] coins!]
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'daily',
    code: `
        $random[10, 50]
        $data[add, user_money_$$author, $$random]
        $say[You earned $$random coins!]
    `
});
```

---

## From Eris

### Basic Setup Migration

**Eris:**
```javascript
const Eris = require('eris');
const bot = Eris('token');

bot.on('messageCreate', (msg) => {
    if (msg.content === '!ping') {
        bot.createMessage(msg.channel.id, 'Pong!');
    }
});

bot.connect();
```

**DeepCode:**
```javascript
const { CharmClient } = require('deepcode-framework');
const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: '!'
});

client.CharmRegisterCommand({
    name: 'ping',
    code: `$say[Pong!]`
});

client.login('token');
```

---

## From Commando

### Command Class Migration

**Commando:**
```javascript
const { Command } = require('discord.js-commando');

class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            group: 'util',
            memberName: 'ping',
            description: 'Ping command'
        });
    }

    run(message) {
        return message.reply('Pong!');
    }
}
```

**DeepCode:**
```javascript
client.CharmRegisterCommand({
    name: 'ping',
    description: 'Ping command',
    category: 'util',
    code: `$reply[Pong!]`
});
```

---

## General Migration Tips

### 1. Understanding Charms vs Functions

**Traditional Approach:**
```javascript
// Multiple function calls
const user = await guild.members.fetch(userId);
const roles = user.roles.cache.map(role => role.name);
const joinDate = user.joinedAt.toDateString();
```

**DeepCode Approach:**
```javascript
// Single charm operations
$user[$$mention, roles]
$time[format, $user[$$mention, joinedAt], date]
```

### 2. Variable Management

**Traditional:**
```javascript
// Database queries
const userData = await db.get(`user_${userId}`);
userData.coins += 50;
await db.set(`user_${userId}`, userData);
```

**DeepCode:**
```javascript
// Built-in persistence
$data[add, user_coins_$$author, 50]
```

### 3. Event Handling

**Traditional:**
```javascript
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
    channel.send(`Welcome ${member}!`);
});
```

**DeepCode:**
```javascript
$event[listen, {
    "event": "guildMemberAdd",
    "action": "$say[Welcome $user[$$user, mention]!]"
}]
```

### 4. Complex Logic

**Traditional:**
```javascript
if (message.member.permissions.has('ADMINISTRATOR')) {
    if (args[0] === 'ban' && message.mentions.users.size > 0) {
        const user = message.mentions.users.first();
        await message.guild.members.ban(user);
        message.reply('User banned');
    }
}
```

**DeepCode:**
```javascript
$condition[$member[$$author, permissions].includes('ADMINISTRATOR')]
    $condition[$$arg[1] == 'ban' && $$mention != null]
        $ban[$$mention]
        $reply[User banned]
```

### 5. Async Operations

**Traditional:**
```javascript
async function complexOperation() {
    const data = await fetchData();
    const processed = await processData(data);
    return await saveData(processed);
}
```

**DeepCode:**
```javascript
// Charms handle async automatically
$data[get, complex_data]
$string[process, $$data]
$data[set, processed_data, $$string]
```

---

## Migration Checklist

### ✅ Pre-Migration
- [ ] Backup your existing bot code
- [ ] List all current commands and features
- [ ] Identify custom functions and logic
- [ ] Document your database schema

### ✅ During Migration
- [ ] Install DeepCode framework
- [ ] Set up basic client configuration
- [ ] Migrate commands one by one
- [ ] Test each migrated command
- [ ] Migrate event handlers
- [ ] Update database operations

### ✅ Post-Migration
- [ ] Test all functionality thoroughly
- [ ] Update documentation
- [ ] Train team members on new syntax
- [ ] Monitor for any issues
- [ ] Optimize using DeepCode features

---

## Common Pitfalls

### 1. Variable Naming
```javascript
// ❌ Don't use old variable patterns
$getVar[coins;$authorID]

// ✅ Use DeepCode data system
$data[get, user_coins_$$author]
```

### 2. Permission Checking
```javascript
// ❌ Don't assume permission methods
message.member.hasPermission('BAN_MEMBERS')

// ✅ Use DeepCode permission charm
$member[$$author, permissions].includes('BAN_MEMBERS')
```

### 3. Async Handling
```javascript
// ❌ Don't worry about async/await
await message.guild.members.ban(user);

// ✅ Charms handle async automatically
$ban[$$mention]
```

---

## Getting Help

- **Documentation**: [Complete API Reference](./api.md)
- **Examples**: [Practical Examples](../examples/)
---

**Migration complete? Welcome to the most powerful Discord bot framework! 🚀**
