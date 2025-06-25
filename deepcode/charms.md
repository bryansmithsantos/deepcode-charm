# Charm API Reference

## Core Concepts

Charms are the building blocks of the DeepCode framework. Each charm follows this structure:
```javascript
$charmName[{
    "action": "actionName",
    "options": {
        // action-specific options
    }
}]
```

## Tier 1 Charms (Basic)

### $say
Send messages and responses.
```javascript
// Simple message
$say[Hello World!]

// With options
$say[{
    "content": "Hello",
    "tts": true,
    "reply": true,
    "ephemeral": true
}]
```

### $data
Variable operations and storage.
```javascript
// Set value
$data[{
    "action": "set",
    "key": "points",
    "value": 100
}]

// Get value
$data[{
    "action": "get",
    "key": "points"
}]

// Increment/Add
$data[{
    "action": "add",
    "key": "points",
    "value": 5
}]

// Check existence
$data[{
    "action": "exists",
    "key": "points"
}]
```

### $string
String manipulation operations.
```javascript
// Case conversion
$string[{
    "action": "case",
    "text": "hello world",
    "type": "title" // upper, lower, camel, snake, kebab
}]

// Substring
$string[{
    "action": "substring",
    "text": "hello world",
    "start": 0,
    "end": 5
}]

// Replace
$string[{
    "action": "replace",
    "text": "hello world",
    "search": "world",
    "replace": "there",
    "regex": false
}]
```

### $array
Array operations.
```javascript
// Push item
$array[{
    "action": "push",
    "array": "myArray",
    "value": "item"
}]

// Get item
$array[{
    "action": "get",
    "array": "myArray",
    "index": 0
}]

// Filter
$array[{
    "action": "filter",
    "array": "myArray",
    "key": "score",
    "value": 100
}]
```

### $condition
Conditional logic.
```javascript
$condition[{
    "left": "$$variable",
    "operator": "equals",
    "right": "value",
    "then": "$say[True!]",
    "else": "$say[False!]"
}]

// Available operators:
// equals, notEquals, greater, less, includes, matches
```

## Tier 2 Charms (Intermediate)

### $message
Advanced message operations.
```javascript
// Edit message
$message[{
    "action": "edit",
    "messageId": "ID",
    "content": "New content"
}]

// React
$message[{
    "action": "react",
    "messageId": "ID",
    "emoji": "👍"
}]

// Delete
$message[{
    "action": "delete",
    "messageId": "ID"
}]

// Search
$message[{
    "action": "search",
    "query": "keyword",
    "limit": 10,
    "includePinned": false
}]
```

### $channel
Channel management.
```javascript
// Create channel
$channel[{
    "action": "create",
    "options": {
        "name": "channel-name",
        "type": "GUILD_TEXT",
        "topic": "Description"
    }
}]

// Set permissions
$channel[{
    "action": "setPerms",
    "id": "CHANNEL_ID",
    "options": {
        "target": "ROLE_ID",
        "allow": ["VIEW_CHANNEL"],
        "deny": ["SEND_MESSAGES"]
    }
}]
```

### $component
Interactive components.
```javascript
// Create button
$component[{
    "action": "create",
    "type": "button",
    "options": {
        "label": "Click me",
        "style": "PRIMARY",
        "customId": "button1"
    }
}]

// Create select menu
$component[{
    "action": "create",
    "type": "select",
    "options": {
        "placeholder": "Choose an option",
        "customId": "select1",
        "options": [
            {
                "label": "Option 1",
                "value": "1"
            }
        ]
    }
}]
```

## Tier 3 Charms (Advanced)

### $permission
Permission management.
```javascript
// Check permissions
$permission[{
    "action": "check",
    "permissions": ["MANAGE_MESSAGES"],
    "member": "USER_ID"
}]

// Grant permissions
$permission[{
    "action": "grant",
    "permissions": ["MANAGE_MESSAGES"],
    "roles": ["ROLE_ID"],
    "channels": ["CHANNEL_ID"]
}]
```

### $voice
Voice channel operations.
```javascript
// Move members
$voice[{
    "action": "move",
    "users": ["USER_ID"],
    "channel": "CHANNEL_ID"
}]

// Mute/Deafen
$voice[{
    "action": "mute",
    "users": ["USER_ID"],
    "state": true
}]
```

### $system
System operations.
```javascript
// Get info
$system[{
    "action": "info"
}]

// Execute code
$system[{
    "action": "eval",
    "code": "code here",
    "async": true
}]

// Manage cache
$system[{
    "action": "cache",
    "target": "messages",
    "action": "clear"
}]
```

### $timer
Scheduling operations.
```javascript
// Schedule task
$timer[{
    "action": "schedule",
    "time": "5m",
    "command": {
        "code": "$say[Time's up!]"
    },
    "recurring": false
}]

// List schedules
$timer[{
    "action": "list",
    "filter": "channel"
}]
```

## Custom Charm Development

Create custom charms by extending the base charm:

```javascript
// charms/custom.js
module.exports = {
    name: 'custom',
    description: 'Custom functionality',
    
    async execute(args, context) {
        const { action, options } = args;
        
        // Implement charm logic
        switch (action) {
            case 'customAction':
                // Handle action
                break;
                
            default:
                throw new Error('Invalid action');
        }
    }
};
```

## Best Practices

1. Always validate input parameters
2. Use proper error handling
3. Follow the tier system for complexity
4. Document all actions and options
5. Use typescript-like typing for parameters
6. Include examples in documentation
7. Test edge cases
8. Consider performance impacts

## Error Handling

Every charm should handle errors gracefully:

```javascript
try {
    // Charm logic
} catch (error) {
    throw new Error(`Charm error: ${error.message}`);
}
```

For more information, see:
- [Usage Guide](usage.md)
- [Advanced Topics](advanced.md)
- [Command Reference](commands.md)
