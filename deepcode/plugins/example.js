/**
 * Example plugin demonstrating plugin system features
 */
class ExamplePlugin {
    constructor(bot) {
        this.bot = bot;
        this.name = 'example';
        this.description = 'Example plugin demonstrating features';
        this.version = '1.0.0';

        // Plugin configuration
        this.config = {
            enabled: true,
            prefix: '!',
            channel: null,
            cooldown: '10s',
            responses: [
                'Hello!',
                'Hi there!',
                'Greetings!',
                'Hey!'
            ]
        };

        // Plugin variables
        this.variables = {
            uses: 0,
            lastUse: null
        };

        // Command cooldowns
        this.cooldowns = new Map();
    }

    /**
     * Called when plugin is loaded
     */
    async onLoad() {
        // Register plugin commands
        this.registerCommands();

        // Add event listeners
        this.bot.on('messageCreate', this.handleMessage.bind(this));

        // Initialize variables
        this.bot.variables({
            'example.uses': 0,
            'example.enabled': this.config.enabled
        });

        console.log(`✓ Plugin ${this.name} v${this.version} loaded`);
    }

    /**
     * Called when plugin is unloaded
     */
    async onUnload() {
        // Remove event listeners
        this.bot.off('messageCreate', this.handleMessage);

        // Cleanup
        this.cooldowns.clear();
        console.log(`✓ Plugin ${this.name} unloaded`);
    }

    /**
     * Register plugin commands
     */
    registerCommands() {
        // Example command
        this.bot.command('example-plugin', `$say[{
            "embeds": [{
                "title": "Example Plugin",
                "description": "Plugin is working!",
                "fields": [
                    {
                        "name": "Uses",
                        "value": "$$example.uses",
                        "inline": true
                    },
                    {
                        "name": "Status",
                        "value": "$$example.enabled",
                        "inline": true
                    }
                ],
                "color": 3447003
            }]
        }]`);

        // Toggle plugin
        this.bot.command('example-toggle', {
            description: 'Toggle example plugin',
            permissions: ['Administrator'],
            code: `$say[{
                "embeds": [{
                    "title": "Plugin Toggled",
                    "description": "Example plugin is now $$example.enabled",
                    "color": 3066993
                }]
            }]`
        });

        // Set channel
        this.bot.command('example-channel', {
            description: 'Set example channel',
            permissions: ['ManageChannels'],
            code: `$say[{
                "embeds": [{
                    "title": "Channel Set",
                    "description": "Example channel set to $$args[0]",
                    "color": 3066993
                }]
            }]`
        });
    }

    /**
     * Handle incoming messages
     */
    async handleMessage(message) {
        if (!this.config.enabled) return;
        if (message.author.bot) return;
        if (!this.checkCooldown(message.author.id)) return;

        // Check for plugin prefix
        if (!message.content.startsWith(this.config.prefix)) return;

        // Get random response
        const response = this.getRandomResponse();

        try {
            // Send response
            await message.channel.send(response);

            // Update stats
            this.variables.uses++;
            this.bot.variables['example.uses'] = this.variables.uses;

        } catch (error) {
            console.error(`Error in ${this.name} plugin:`, error);
        }
    }

    /**
     * Check user cooldown
     */
    checkCooldown(userId) {
        const now = Date.now();
        const cooldownTime = this.parseDuration(this.config.cooldown);
        const userCooldown = this.cooldowns.get(userId);

        if (userCooldown && now - userCooldown < cooldownTime) {
            return false;
        }

        this.cooldowns.set(userId, now);
        return true;
    }

    /**
     * Get random response
     */
    getRandomResponse() {
        const index = Math.floor(Math.random() * this.config.responses.length);
        return this.config.responses[index];
    }

    /**
     * Parse duration string to milliseconds
     */
    parseDuration(str) {
        const units = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000
        };

        const match = str.match(/^(\d+)([smhd])$/);
        if (!match) return 60000; // Default 1 minute

        const [, num, unit] = match;
        return parseInt(num) * units[unit];
    }

    /**
     * Handle plugin configuration updates
     */
    async onConfigUpdate(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log(`Plugin ${this.name} config updated:`, this.config);
    }
}

module.exports = ExamplePlugin;
