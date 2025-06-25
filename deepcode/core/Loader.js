const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const BaseCharm = require('../charms/BaseCharm');

/**
 * Component loader for bot
 */
class Loader {
    constructor(client) {
        this.client = client;
        this.rootDir = process.cwd();
        this.debug = client.debug || false;
    }

    /**
     * Load all components
     */
    async loadAll() {
        console.log(chalk.blue('\nLoading components...'));
        
        try {
            // Load config first
            await this.loadConfig();
            
            // Load core components
            await this.loadEvents();
            await this.loadCommands();
            await this.loadCharms();
            
            console.log(chalk.green('\n✓ All components loaded successfully\n'));

        } catch (error) {
            console.error(chalk.red('\nError loading components:'), error);
            throw error;
        }
    }

    /**
     * Load bot configuration
     */
    async loadConfig() {
        try {
            let config = {};

            // Load from config file if exists
            const configPath = path.join(this.rootDir, 'charm.config.js');
            if (await this.fileExists(configPath)) {
                config = require(configPath);
                console.log(chalk.gray('  • Configuration loaded'));
            }

            // Store config
            this.client.config = config;

        } catch (error) {
            console.error(chalk.red('Error loading config:'), error);
            throw error;
        }
    }

    /**
     * Load event handlers
     */
    async loadEvents() {
        try {
            const eventsDir = path.join(this.rootDir, 'events');
            
            // Skip if directory doesn't exist
            if (!await this.fileExists(eventsDir)) {
                return;
            }

            // Load event files
            const files = await this.getFiles(eventsDir, '.js');
            
            for (const file of files) {
                const event = require(file);
                this.client.events.register(event);
            }

            console.log(chalk.gray(`  • Loaded ${files.length} events`));

        } catch (error) {
            console.error(chalk.red('Error loading events:'), error);
            throw error;
        }
    }

    /**
     * Load commands
     */
    async loadCommands() {
        try {
            // Use CharmCommandLoader if available (preferred method)
            if (this.client.CharmCommander) {
                const loadedCount = await this.client.CharmCommander.loadCommands();
                console.log(chalk.gray(`  • CharmCommandLoader loaded ${loadedCount} commands`));
                return;
            }

            // Fallback to legacy loading method
            const commandsDir = path.join(this.rootDir, 'commands');

            // Skip if directory doesn't exist
            if (!await this.fileExists(commandsDir)) {
                return;
            }

            // Load command files
            const files = await this.getFiles(commandsDir, '.js');

            for (const file of files) {
                const command = require(file);
                if (!command) {
                    console.warn(`Warning: Command file ${file} did not export a command. Skipping.`);
                    continue;
                }
                this.client.commands.register(command);
            }

            console.log(chalk.gray(`  • Loaded ${files.length} commands (legacy method)`));

        } catch (error) {
            console.error(chalk.red('Error loading commands:'), error);
            throw error;
        }
    }

    /**
     * Load charms
     */
    async loadCharms() {
        try {
            const charmsDir = path.join(this.rootDir, 'charms');
            
            // Skip if directory doesn't exist
            if (!await this.fileExists(charmsDir)) {
                return;
            }

            // Load charm files
            const files = await this.getFiles(charmsDir, '.js');
            let loadedCount = 0;
            
            for (const file of files) {
                const charmName = path.basename(file, '.js');

                // Skip the base class itself
                if (charmName.toLowerCase() === 'basecharm') {
                    continue;
                }

                const CharmClass = require(file);

                // Check if it's a new class-based charm
                if (CharmClass.prototype instanceof BaseCharm) {
                    const charmInstance = new CharmClass(this.client);
                    this.client.charms.set(charmName, charmInstance);
                    loadedCount++;
                } 
                // Handle old object-based charms for compatibility
                else if (typeof CharmClass === 'object' && CharmClass.name) {
                    console.warn(chalk.yellow(`  -> Warning: Charm '${CharmClass.name}' is using a legacy format. Please update it to a class-based structure.`));
                    this.client.charms.set(CharmClass.name, CharmClass);
                    loadedCount++;
                }
            }

            console.log(chalk.gray(`  • Loaded ${loadedCount} charms`));

        } catch (error) {
            console.error(chalk.red('Error loading charms:'), error);
            throw error;
        }
    }

    /**
     * Get all files in directory recursively
     */
    async getFiles(dir, ext = '') {
        let files = [];
        
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                files = files.concat(await this.getFiles(itemPath, ext));
            } else if (item.name.endsWith(ext)) {
                files.push(itemPath);
            }
        }
        
        return files;
    }

    /**
     * Check if file/directory exists
     */
    async fileExists(pathToCheck) {
        try {
            await fs.access(pathToCheck);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = Loader;
