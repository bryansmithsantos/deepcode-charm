#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
let chalk;
try {
    const chalkModule = require('chalk');
    chalk = chalkModule.default || chalkModule;
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
const path = require('path');
const fs = require('fs').promises;
const { setupWizard } = require('./setup');
const pkg = require('../package.json');

program
    .name('charm')
    .description('DeepCode Charm Framework CLI')
    .version(pkg.version);

/**
 * Start command
 */
program
    .command('start')
    .description('Start the Discord bot')
    .option('-d, --debug', 'Enable debug mode')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (options) => {
        try {
            const startBot = require('../test/bot');
            await startBot();
        } catch (error) {
            console.error(chalk.red('\nFailed to start bot:'), error);
            process.exit(1);
        }
    });

/**
 * Init command
 */
program
    .command('init')
    .description('Initialize a new DeepCode bot project')
    .argument('[name]', 'Project name')
    .option('-t, --template <template>', 'Template to use (basic, moderation, economy)', 'basic')
    .action(async (name, options) => {
        try {
            if (!name) {
                const answer = await inquirer.prompt([{
                    type: 'input',
                    name: 'name',
                    message: 'Enter the project name:',
                    default: 'my-discord-bot',
                    validate: input => input.length > 0 || 'Project name is required'
                }]);
                name = answer.name;
            }

            await initProject(name, options.template);
        } catch (error) {
            console.error(chalk.red('\nInitialization failed:'), error);
            process.exit(1);
        }
    });

/**
 * Setup command
 */
program
    .command('setup')
    .description('Run the setup wizard')
    .option('-f, --force', 'Force setup even if already configured')
    .action(async (options) => {
        try {
            await setupWizard();
        } catch (error) {
            console.error(chalk.red('\nSetup failed:'), error);
            process.exit(1);
        }
    });

/**
 * Create command
 */
program
    .command('create')
    .description('Create a new component')
    .argument('<type>', 'Component type (command/event/plugin)')
    .argument('[name]', 'Component name')
    .action(async (type, name) => {
        try {
            if (!name) {
                const answer = await inquirer.prompt([{
                    type: 'input',
                    name: 'name',
                    message: `Enter the ${type} name:`,
                    validate: input => input.length > 0 || 'Name is required'
                }]);
                name = answer.name;
            }

            await createComponent(type, name);

        } catch (error) {
            console.error(chalk.red('\nCreation failed:'), error);
            process.exit(1);
        }
    });

/**
 * Initialize a new project
 */
async function initProject(name, template) {
    console.log(chalk.blue(`\n🚀 Initializing DeepCode project: ${name}`));

    // Create project directory
    const projectPath = path.join(process.cwd(), name);
    await fs.mkdir(projectPath, { recursive: true });

    // Create package.json
    const packageJson = {
        name: name,
        version: "1.0.0",
        description: "A Discord bot built with DeepCode Framework",
        main: "index.js",
        scripts: {
            start: "node index.js",
            dev: "node index.js"
        },
        dependencies: {
            "deepcode-charm": "^0.0.5",
            "dotenv": "^16.0.0"
        }
    };

    await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    // Create main bot file
    const botTemplate = `require('dotenv').config();
const { CharmClient } = require('deepcode-charm');

const client = new CharmClient({
    intents: ['Guilds', 'GuildMessages', 'MessageContent'],
    prefix: process.env.PREFIX || '!',
    status: 'Ready to serve!'
});

// Basic ping command
client.CharmRegisterCommand({
    name: 'ping',
    code: \`$embed[{
        "title": "🏓 Pong!",
        "fields": [
            { "name": "Latency", "value": "$$ping ms", "inline": true },
            { "name": "Uptime", "value": "$time[format, $$uptime, duration]", "inline": true }
        ],
        "color": "GREEN"
    }]\`
});

// Auto-load commands from directory
client.CharmCommander('commands').catch(console.error);

client.login(process.env.DISCORD_TOKEN);
`;

    await fs.writeFile(path.join(projectPath, 'index.js'), botTemplate);

    // Create .env file
    const envTemplate = `DISCORD_TOKEN=your_bot_token_here
PREFIX=!
NODE_ENV=development
`;

    await fs.writeFile(path.join(projectPath, '.env'), envTemplate);

    // Create commands directory with example
    const commandsPath = path.join(projectPath, 'commands');
    await fs.mkdir(commandsPath, { recursive: true });

    const exampleCommand = `module.exports = {
    name: 'hello',
    description: 'Say hello to the user',
    code: \`$embed[{
        "title": "👋 Hello!",
        "description": "Hello $user[$$author, mention]! Welcome to our server!",
        "color": "BLUE"
    }]\`
};
`;

    await fs.writeFile(path.join(commandsPath, 'hello.js'), exampleCommand);

    // Create .gitignore
    const gitignore = `node_modules/
.env
*.log
data/
`;

    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

    console.log(chalk.green(`\n✓ Project ${name} created successfully!`));
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.gray(`  cd ${name}`));
    console.log(chalk.gray('  npm install'));
    console.log(chalk.gray('  # Edit .env file with your bot token'));
    console.log(chalk.gray('  npm start'));
    console.log();
}

/**
 * Create a new component
 */
async function createComponent(type, name) {
    const templates = {
        command: `module.exports = {
    name: '${name}',
    description: '${name} command',
    code: '$say[Hello from ${name} command!]'
};`,
        event: `module.exports = {
    name: '${name}',
    once: false,
    async execute(...args) {
        // Your event code here
        console.log('${name} event triggered');
    }
};`,
        plugin: `class ${capitalize(name)}Plugin {
    constructor(bot) {
        this.bot = bot;
        this.name = '${name}';
    }

    async onLoad() {
        console.log('${name} plugin loaded');
        // Initialize your plugin
    }

    async onUnload() {
        // Cleanup
    }
}

module.exports = ${capitalize(name)}Plugin;`
    };

    if (!templates[type]) {
        throw new Error(`Invalid component type: ${type}`);
    }

    const dirs = {
        command: 'commands',
        event: 'events',
        plugin: 'plugins'
    };

    const dir = dirs[type];
    if (!dir) {
        throw new Error(`Invalid component type: ${type}`);
    }

    // Create directory if it doesn't exist
    const dirPath = path.join(process.cwd(), dir);
    await fs.mkdir(dirPath, { recursive: true });

    // Create file
    const filePath = path.join(dirPath, `${name}.js`);
    await fs.writeFile(filePath, templates[type]);

    console.log(chalk.green(`\n✓ Created ${type}: ${filePath}`));
    console.log(chalk.gray('\nAdd to your bot:'));

    switch (type) {
        case 'command':
            console.log(chalk.gray(`bot.loadCommand('${name}');`));
            break;
        case 'event':
            console.log(chalk.gray(`bot.events.on('${name}', (...args) => {});`));
            break;
        case 'plugin':
            console.log(chalk.gray(`bot.loadPlugin(new ${capitalize(name)}Plugin());`));
            break;
    }

    console.log();
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Parse command line arguments
program.parse();
