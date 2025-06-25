#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
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
