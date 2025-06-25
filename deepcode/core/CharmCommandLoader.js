const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

/**
 * CharmCommandLoader - Automatic command loading system
 * Provides recursive directory scanning and auto-loading of command files
 */
class CharmCommandLoader {
    constructor(client) {
        this.client = client;
        this.rootDir = process.cwd();
        this.debug = client.debug || false;
        this.loadedCommands = new Map();
    }

    /**
     * Load all commands from the commands directory
     * @param {string} commandsDir - Directory to load commands from
     * @returns {Promise<number>} Number of commands loaded
     */
    async loadCommands(commandsDir = 'commands') {
        try {
            const fullPath = path.join(this.rootDir, commandsDir);
            
            // Skip if directory doesn't exist
            if (!await this.fileExists(fullPath)) {
                if (this.debug) {
                    console.log(chalk.gray(`Commands directory not found: ${fullPath}`));
                }
                return 0;
            }

            // Load command files recursively
            const files = await this.getFiles(fullPath, '.js');
            let loadedCount = 0;
            
            for (const file of files) {
                try {
                    const command = await this.loadCommandFile(file);
                    if (command) {
                        this.registerCommand(command);
                        loadedCount++;
                    }
                } catch (error) {
                    console.error(chalk.red(`Error loading command from ${file}:`), error);
                }
            }

            if (this.debug) {
                console.log(chalk.green(`✓ CharmCommandLoader loaded ${loadedCount} commands`));
            }

            return loadedCount;

        } catch (error) {
            console.error(chalk.red('Error in CharmCommandLoader:'), error);
            throw error;
        }
    }

    /**
     * Load a single command file
     * @param {string} filePath - Path to the command file
     * @returns {Promise<Object|null>} Command object or null if invalid
     */
    async loadCommandFile(filePath) {
        try {
            // Clear require cache to allow hot reloading
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            if (!command) {
                console.warn(chalk.yellow(`Warning: Command file ${filePath} did not export a command. Skipping.`));
                return null;
            }

            // Validate command structure
            if (!this.validateCommand(command)) {
                return null;
            }

            // Add file path for debugging
            command._filePath = filePath;
            
            return command;

        } catch (error) {
            console.error(chalk.red(`Error loading command file ${filePath}:`), error);
            return null;
        }
    }

    /**
     * Validate command structure
     * @param {Object} command - Command to validate
     * @returns {boolean} True if valid
     */
    validateCommand(command) {
        if (!command.name) {
            console.warn(chalk.yellow('Skipping command registration: Command must have a name.'));
            return false;
        }

        if (!command.code && !command.execute && !command.run) {
            console.warn(chalk.yellow(`Skipping command '${command.name}': Command must have code, execute, or run method.`));
            return false;
        }

        return true;
    }

    /**
     * Register a command with the client
     * @param {Object} command - Command to register
     */
    registerCommand(command) {
        try {
            // Use the client's command registration system
            this.client.commands.register(command);
            
            // Track loaded commands
            this.loadedCommands.set(command.name, {
                command,
                loadedAt: new Date(),
                filePath: command._filePath
            });

            if (this.debug) {
                console.log(chalk.gray(`  • Registered command: ${command.name}`));
            }

        } catch (error) {
            console.error(chalk.red(`Error registering command ${command.name}:`), error);
        }
    }

    /**
     * Reload a specific command
     * @param {string} commandName - Name of command to reload
     * @returns {Promise<boolean>} True if reloaded successfully
     */
    async reloadCommand(commandName) {
        try {
            const commandInfo = this.loadedCommands.get(commandName);
            if (!commandInfo) {
                console.warn(chalk.yellow(`Command '${commandName}' not found in loaded commands.`));
                return false;
            }

            // Unregister old command
            this.client.commands.unregister(commandName);
            
            // Load and register new version
            const command = await this.loadCommandFile(commandInfo.filePath);
            if (command) {
                this.registerCommand(command);
                console.log(chalk.green(`✓ Reloaded command: ${commandName}`));
                return true;
            }

            return false;

        } catch (error) {
            console.error(chalk.red(`Error reloading command ${commandName}:`), error);
            return false;
        }
    }

    /**
     * Get all files in directory recursively
     * @param {string} dir - Directory to scan
     * @param {string} ext - File extension to filter by
     * @returns {Promise<string[]>} Array of file paths
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
     * @param {string} pathToCheck - Path to check
     * @returns {Promise<boolean>} True if exists
     */
    async fileExists(pathToCheck) {
        try {
            await fs.access(pathToCheck);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get information about loaded commands
     * @returns {Object} Command loading statistics
     */
    getLoadedCommandsInfo() {
        const commands = Array.from(this.loadedCommands.entries()).map(([name, info]) => ({
            name,
            loadedAt: info.loadedAt,
            filePath: info.filePath
        }));

        return {
            count: this.loadedCommands.size,
            commands
        };
    }
}

module.exports = CharmCommandLoader;
