# DeepCode Events

This document describes the event system and available events in DeepCode.

## Event System Overview

DeepCode uses an event-driven architecture where various components can emit and listen to events. Events are handled asynchronously and can be used to trigger charm code execution.

## Core Events

### Message Events

```javascript
// Message created
message.create: {
    content: string,
    author: User,
    channel: Channel,
    guild: Guild
}

// Message updated
message.update: {
    oldMessage: Message,
    newMessage: Message
}

// Message deleted
message.delete: {
    message: Message,
    channel: Channel
}
```

### Member Events

```javascript
// Member joined
member.join: {
    member: Member,
    guild: Guild
}

// Member left
member.leave: {
    member: Member,
    guild: Guild
}

// Member updated
member.update: {
    oldMember: Member,
    newMember: Member
}
```

### Channel Events

```javascript
// Channel created
channel.create: {
    channel: Channel,
    guild: Guild
}

// Channel updated
channel.update: {
    oldChannel: Channel,
    newChannel: Channel
}

// Channel deleted
channel.delete: {
    channel: Channel,
    guild: Guild
}
```

### Role Events

```javascript
// Role created
role.create: {
    role: Role,
    guild: Guild
}

// Role updated
role.update: {
    oldRole: Role,
    newRole: Role
}

// Role deleted
role.delete: {
    role: Role,
    guild: Guild
}
```

## Interaction Events

### Button Events

```javascript
// Button clicked
button.click: {
    button: Button,
    user: User,
    message: Message
}

// Button custom id format: 
// action:param1:param2
```

### Select Menu Events

```javascript
// Select option chosen
select.choose: {
    values: string[],
    user: User,
    message: Message
}
```

### Modal Events

```javascript
// Modal submitted
modal.submit: {
    fields: Object,
    user: User,
    interaction: Interaction
}
```

## Custom Events

You can create and emit custom events:

```javascript
// Custom event
events.emit('custom.event', {
    data: 'Custom data'
});

// Listen for custom event
events.on('custom.event', (data) => {
    // Handle event
});
```

## Event Handlers

Example of event handler registration:

```javascript
// Simple handler
events.on('message.create', (message) => {
    console.log(`New message: ${message.content}`);
});

// Handler with filter
events.on('message.create', {
    filter: (message) => message.content.startsWith('!'),
    handler: (message) => handleCommand(message)
});

// One-time handler
events.once('member.join', (member) => {
    welcomeMember(member);
});
```

## Event Context

Events provide context to charm code:

```javascript
// Available in event handlers
$$event: {
    name: string,      // Event name
    data: any,         // Event data
    timestamp: number, // Event time
    guild: Guild,      // Guild context
    source: string     // Event source
}
```

## Error Events 

```javascript
// Error occurred
error: {
    error: Error,
    context: any,
    timestamp: number
}

// Warning occurred
warning: {
    message: string,
    context: any,
    timestamp: number
}
```

## System Events

```javascript
// Bot ready
ready: {
    user: ClientUser,
    guilds: number
}

// Debug info
debug: {
    message: string,
    timestamp: number
}

// Cache invalidated
cache.invalidate: {
    type: string,
    keys: string[]
}
```

## Event Middleware

You can add middleware to process events:

```javascript
// Add middleware
events.use((event, next) => {
    // Process event
    console.log(`Event: ${event.name}`);
    next();
});

// Filter middleware
events.use((event, next) => {
    if (event.guild) next();
});

// Transform middleware
events.use((event, next) => {
    event.data = transform(event.data);
    next();
});
```

For more information about specific events and their data structures, check the Discord.js documentation or DeepCode source code.
