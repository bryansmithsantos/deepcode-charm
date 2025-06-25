// Example command file for automatic loading
// This file would be placed in the 'commands' directory

module.exports = {
    name: 'example',
    description: 'Example command with template literals',
    usage: '@user [message]',
    aliases: ['ex', 'demo'],
    category: 'General',
    cooldown: 3,
    code: `$embed[{
        "title": "🎉 Example Command",
        "description": "This command was loaded automatically!",
        "fields": [
            {"name": "👤 Author", "value": "$$author.tag", "inline": true},
            {"name": "📝 Args", "value": "$$args || 'No arguments'", "inline": true},
            {"name": "🏷️ Mention", "value": "$$mention || 'No mention'", "inline": true}
        ],
        "color": "RANDOM",
        "timestamp": true,
        "footer": {"text": "Loaded from file!"}
    }]`
};
