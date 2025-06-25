/**
 * Example commands showing different syntax styles
 */
module.exports = [
    // Basic hello command
    {
        name: 'hello',
        description: 'Basic greeting command',
        code: '$say[Hello $$username! Welcome to $$guild]'
    },

    // Ping command with latency
    {
        name: 'ping',
        description: 'Check bot latency',
        code: `$say[{
            "content": "🏓 Pong!",
            "embeds": [{
                "title": "Bot Latency",
                "description": "Current latency information:",
                "fields": [
                    {
                        "name": "Bot Latency",
                        "value": "$$ping",
                        "inline": true
                    },
                    {
                        "name": "Messages",
                        "value": "$$counter.messages",
                        "inline": true
                    },
                    {
                        "name": "Commands",
                        "value": "$$stats.commands",
                        "inline": true
                    }
                ],
                "color": 3447003
            }]
        }]`
    },

    // About command with bot info
    {
        name: 'about',
        aliases: ['botinfo', 'info'],
        description: 'Show bot information',
        code: `$say[{
            "embeds": [{
                "title": "CharmBot Information",
                "description": "A powerful Discord bot framework with multi-tier syntax support",
                "fields": [
                    {
                        "name": "Version",
                        "value": "1.0.0",
                        "inline": true
                    },
                    {
                        "name": "Library",
                        "value": "discord.js v14",
                        "inline": true
                    },
                    {
                        "name": "Prefix",
                        "value": "$$prefix",
                        "inline": true
                    },
                    {
                        "name": "Commands",
                        "value": "$$stats.commands run",
                        "inline": true
                    },
                    {
                        "name": "Messages",
                        "value": "$$counter.messages seen",
                        "inline": true
                    },
                    {
                        "name": "Uptime",
                        "value": "$$uptime",
                        "inline": true
                    }
                ],
                "color": 7506394,
                "footer": {
                    "text": "Created with CharmBot Framework",
                    "icon_url": "$$avatar"
                }
            }]
        }]`
    },

    // Test command to show syntax tiers
    {
        name: 'test',
        description: 'Test different syntax tiers',
        code: `$say[
            content: Testing command syntax tiers;
            embedTitle: Command Syntax Demo;
            embedDescription: Here are the different ways to format commands;
            embedColor: #7289DA;
            embedFooter: Simple key-value format
        ]`
    },

    // Example moderation-style command
    {
        name: 'warn',
        description: 'Example moderation command',
        code: `$say[{
            "content": "⚠️ Warning Example",
            "embeds": [{
                "title": "User Warning",
                "description": "This is an example warning message.",
                "fields": [
                    {
                        "name": "User",
                        "value": "$$username",
                        "inline": true
                    },
                    {
                        "name": "Reason",
                        "value": "$$args",
                        "inline": true
                    }
                ],
                "color": 16776960,
                "timestamp": "$$timestamp"
            }]
        }]`
    }
];
