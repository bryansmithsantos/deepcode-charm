#!/usr/bin/env node
let chalk;
try {
    chalk = require('chalk');
} catch (error) {
    // Fallback if chalk is not available
    chalk = {
        blue: (text) => text,
        green: (text) => text,
        yellow: (text) => text,
        red: (text) => text,
        gray: (text) => text,
        bold: (text) => text
    };
}
const fs = require('fs').promises;
const path = require('path');

/**
 * Post-installation setup
 */
async function setup() {
    console.log(chalk.blue('\n=== DeepCode Charm Framework Setup ===\n'));

    try {
        // Create required directories
        const dirs = [
            'commands',
            'events',
            'plugins',
            'config'
        ];

        for (const dir of dirs) {
            await createDir(dir);
        }

        // Create example files
        await createExampleFiles();

        // Create config file if doesn't exist
        await createConfigFile();

        // Create .env file if doesn't exist
        await createEnvFile();

        console.log(chalk.green('\n✓ Setup complete!\n'));
        showNextSteps();

    } catch (error) {
        console.error(chalk.red('\nSetup failed:'), error);
        process.exit(1);
    }
}

/**
 * Create directory if it doesn't exist
 */
async function createDir(dirPath) {
    const fullPath = path.join(process.cwd(), dirPath);
    
    try {
        await fs.access(fullPath);
        console.log(chalk.gray(`  • Found ${dirPath}/`));
    } catch {
        await fs.mkdir(fullPath, { recursive: true });
        console.log(chalk.blue(`  • Created ${dirPath}/`));
    }
}

/**
 * Create example files
 */
async function createExampleFiles() {
    const examples = [
        {
            path: 'commands/example.js',
            content: `module.exports = {
    name: 'example',
    description: 'Example command',
    code: '$say[Hello from DeepCode Charm!]'
};`
        },
        {
            path: 'events/ready.js',
            content: `module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('Bot is ready!');
    }
};`
        },
        {
            path: 'plugins/example.js',
            content: `class ExamplePlugin {
    constructor(bot) {
        this.bot = bot;
        this.name = 'example';
    }

    async onLoad() {
        console.log('Example plugin loaded!');
    }
}

module.exports = ExamplePlugin;`
        }
    ];

    for (const example of examples) {
        const filePath = path.join(process.cwd(), example.path);
        try {
            await fs.access(filePath);
            console.log(chalk.gray(`  • Found ${example.path}`));
        } catch {
            await fs.writeFile(filePath, example.content);
            console.log(chalk.blue(`  • Created ${example.path}`));
        }
    }
}

/**
 * Create default config file
 */
async function createConfigFile() {
    const configPath = path.join(process.cwd(), 'config', 'bot.json');
    const examplePath = path.join(process.cwd(), 'config', 'bot.example.json');

    const defaultConfig = {
        prefix: "!",
        logging: {
            enabled: true,
            channel: null,
            level: "info"
        },
        plugins: {
            automod: {
                enabled: false
            }
        }
    };

    try {
        await fs.access(configPath);
        console.log(chalk.gray('  • Found config/bot.json'));
    } catch {
        // Create bot.json
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log(chalk.blue('  • Created config/bot.json'));

        // Create bot.example.json
        await fs.writeFile(examplePath, JSON.stringify(defaultConfig, null, 2));
        console.log(chalk.blue('  • Created config/bot.example.json'));
    }
}

/**
 * Create .env file if doesn't exist
 */
async function createEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    const envExample = `# Bot Configuration
DISCORD_TOKEN=your-token-here
PREFIX=!
DEBUG=false

# Logging
LOG_LEVEL=info
LOG_CHANNEL=

# Database (optional)
DB_TYPE=sqlite
DB_PATH=data/bot.db`;

    try {
        await fs.access(envPath);
        console.log(chalk.gray('  • Found .env'));
    } catch {
        await fs.writeFile(envPath, envExample);
        console.log(chalk.blue('  • Created .env'));
    }
}

/**
 * Show next steps
 */
function showNextSteps() {
    console.log(chalk.cyan('Next steps:\n'));
    console.log('1. Add your bot token to .env:');
    console.log(chalk.gray('   DISCORD_TOKEN=your-token-here\n'));
    console.log('2. Configure bot settings in config/bot.json\n');
    console.log('3. Start the bot:');
    console.log(chalk.gray('   npm start\n'));
    console.log('4. Create commands:');
    console.log(chalk.gray('   npm run create command hello'));
    console.log(chalk.gray('   npm run create event ready'));
    console.log(chalk.gray('   npm run create plugin welcome\n'));
    console.log(chalk.blue('For more information, see the documentation:'));
    console.log(chalk.gray('https://github.com/yourusername/deepcode-charm#readme\n'));
}

// Run setup if this file is run directly
if (require.main === module) {
    setup();
}

module.exports = setup;
