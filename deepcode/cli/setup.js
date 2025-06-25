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
const fs = require('fs').promises;
const path = require('path');

/**
 * Check if this is first run
 */
async function isFirstRun() {
    try {
        const configPath = path.join(process.cwd(), 'config', 'bot.json');
        await fs.access(configPath);
        return false;
    } catch {
        return true;
    }
}

/**
 * Run setup wizard
 */
async function setupWizard() {
    console.log(chalk.blue('\n=================================================='));
    console.log(chalk.blue('DeepCode Charm Setup Wizard'));
    console.log(chalk.gray('This wizard will help you set up your bot configuration.'));
    console.log(chalk.blue('==================================================\n'));

    try {
        // Get configuration
        const config = await promptConfig();

        // Create directories
        await createDirectories();

        // Save configuration
        await saveConfig(config);

        // Create .env file
        await createEnvFile(config);

        console.log(chalk.blue('\n=================================================='));
        console.log(chalk.green('✓ Setup Complete!\n'));
        console.log('To start your bot:');
        console.log('1. npm start\n');
        console.log('2. npm run create command hello');
        console.log(chalk.blue('==================================================\n'));

    } catch (error) {
        console.error(chalk.red('\nSetup failed:'), error);
        process.exit(1);
    }
}

/**
 * Prompt for configuration
 */
async function promptConfig() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'token',
            message: 'Enter your Discord bot token:',
            validate: input => input.length > 0 || 'Token is required'
        },
        {
            type: 'input',
            name: 'prefix',
            message: 'What prefix would you like to use?',
            default: '!'
        },
        {
            type: 'confirm',
            name: 'logging',
            message: 'Would you like to enable error logging?',
            default: true
        },
        {
            type: 'input',
            name: 'logChannel',
            message: 'Enter log channel ID (optional):',
            when: answers => answers.logging
        },
        {
            type: 'confirm',
            name: 'database',
            message: 'Would you like to set up a database?',
            default: false
        }
    ]);

    return {
        prefix: answers.prefix,
        logging: {
            enabled: answers.logging,
            channel: answers.logChannel || null,
            level: 'info'
        },
        database: answers.database ? {
            enabled: true,
            type: 'sqlite',
            path: 'data/bot.db'
        } : {
            enabled: false
        },
        plugins: {
            automod: {
                enabled: false
            }
        },
        token: answers.token
    };
}

/**
 * Create required directories
 */
async function createDirectories() {
    const dirs = [
        'commands',
        'events',
        'plugins',
        'config',
        'data'
    ];

    for (const dir of dirs) {
        const dirPath = path.join(process.cwd(), dir);
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Save configuration
 */
async function saveConfig(config) {
    // Save bot.json
    const configPath = path.join(process.cwd(), 'config', 'bot.json');
    const { token, ...configData } = config;  // Remove token from config
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

    // Save example config
    const examplePath = path.join(process.cwd(), 'config', 'bot.example.json');
    await fs.writeFile(examplePath, JSON.stringify(configData, null, 2));

    console.log(chalk.green('✔ Configuration saved'));
}

/**
 * Create .env file
 */
async function createEnvFile(config) {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = `# Bot Configuration
DISCORD_TOKEN=${config.token}
PREFIX=${config.prefix}
DEBUG=false

# Logging
LOG_LEVEL=${config.logging.level}
LOG_CHANNEL=${config.logging.channel || ''}

# Database
DB_ENABLED=${config.database.enabled}
DB_TYPE=${config.database.type || 'sqlite'}
DB_PATH=${config.database.path || 'data/bot.db'}
`;

    await fs.writeFile(envPath, envContent);
}

module.exports = {
    setupWizard,
    isFirstRun,
    promptConfig,
    createDirectories,
    saveConfig,
    createEnvFile
};
