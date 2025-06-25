#!/usr/bin/env node
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const packageJson = require('../package.json');

/**
 * Pre-publish checks
 */
async function checkPackage() {
    console.log(chalk.blue('\n=== DeepCode Charm Pre-publish Checks ===\n'));
    let hasErrors = false;

    try {
        // Check package.json
        hasErrors = await checkPackageJson() || hasErrors;

        // Check required files
        hasErrors = await checkRequiredFiles() || hasErrors;

        // Check file permissions
        hasErrors = await checkFilePermissions() || hasErrors;

        // Check dependencies
        hasErrors = await checkDependencies() || hasErrors;

        // Show results
        if (hasErrors) {
            console.error(chalk.red('\n❌ Pre-publish checks failed!\n'));
            process.exit(1);
        } else {
            console.log(chalk.green('\n✓ All pre-publish checks passed!\n'));
        }

    } catch (error) {
        console.error(chalk.red('\nPre-publish check failed:'), error);
        process.exit(1);
    }
}

/**
 * Check package.json
 */
async function checkPackageJson() {
    console.log(chalk.cyan('Checking package.json...'));
    let hasErrors = false;

    // Required fields
    const required = ['name', 'version', 'main', 'bin', 'files'];
    for (const field of required) {
        if (!packageJson[field]) {
            console.error(chalk.red(`  • Missing required field: ${field}`));
            hasErrors = true;
        }
    }

    // Check version format
    if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(packageJson.version)) {
        console.error(chalk.red('  • Invalid version format'));
        hasErrors = true;
    }

    // Check bin paths
    if (packageJson.bin) {
        for (const [name, binPath] of Object.entries(packageJson.bin)) {
            try {
                await fs.access(path.join(process.cwd(), binPath));
            } catch {
                console.error(chalk.red(`  • Binary not found: ${binPath}`));
                hasErrors = true;
            }
        }
    }

    // Check files array
    if (packageJson.files) {
        for (const file of packageJson.files) {
            try {
                await fs.access(path.join(process.cwd(), file));
            } catch {
                console.error(chalk.red(`  • Listed file/directory not found: ${file}`));
                hasErrors = true;
            }
        }
    }

    if (!hasErrors) {
        console.log(chalk.green('  ✓ Package.json is valid'));
    }

    return hasErrors;
}

/**
 * Check required files
 */
async function checkRequiredFiles() {
    console.log(chalk.cyan('\nChecking required files...'));
    let hasErrors = false;

    const required = [
        'README.md',
        'LICENSE',
        'index.js',
        'cli/index.js',
        'core/index.js'
    ];

    for (const file of required) {
        try {
            await fs.access(path.join(process.cwd(), file));
            console.log(chalk.gray(`  • Found ${file}`));
        } catch {
            console.error(chalk.red(`  • Missing required file: ${file}`));
            hasErrors = true;
        }
    }

    if (!hasErrors) {
        console.log(chalk.green('  ✓ All required files present'));
    }

    return hasErrors;
}

/**
 * Check file permissions
 */
async function checkFilePermissions() {
    console.log(chalk.cyan('\nChecking file permissions...'));
    let hasErrors = false;

    const executablePaths = [
        'cli/index.js',
        'scripts/postinstall.js',
        'scripts/prepublish.js'
    ];

    for (const file of executablePaths) {
        try {
            const filePath = path.join(process.cwd(), file);
            const stats = await fs.stat(filePath);
            const isExecutable = !!(stats.mode & 0o111);

            if (!isExecutable) {
                await fs.chmod(filePath, '755');
                console.log(chalk.yellow(`  • Fixed permissions for ${file}`));
            } else {
                console.log(chalk.gray(`  • Correct permissions for ${file}`));
            }
        } catch (error) {
            console.error(chalk.red(`  • Failed to check/fix permissions for ${file}`));
            hasErrors = true;
        }
    }

    if (!hasErrors) {
        console.log(chalk.green('  ✓ All file permissions correct'));
    }

    return hasErrors;
}

/**
 * Check dependencies
 */
async function checkDependencies() {
    console.log(chalk.cyan('\nChecking dependencies...'));
    let hasErrors = false;

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    // Check for duplicate dependencies
    const allDeps = new Set([...Object.keys(deps), ...Object.keys(devDeps)]);
    if (allDeps.size < Object.keys(deps).length + Object.keys(devDeps).length) {
        console.error(chalk.red('  • Found duplicate dependencies'));
        hasErrors = true;
    }

    // Check for required dependencies
    const required = ['discord.js', 'chalk', 'commander'];
    for (const dep of required) {
        if (!deps[dep]) {
            console.error(chalk.red(`  • Missing required dependency: ${dep}`));
            hasErrors = true;
        }
    }

    // Check version constraints
    if (deps['discord.js'] && !deps['discord.js'].match(/^14\./)) {
        console.warn(chalk.yellow('  • Warning: discord.js version should be 14.x'));
    }

    if (!hasErrors) {
        console.log(chalk.green('  ✓ Dependencies are valid'));
    }

    return hasErrors;
}

// Run checks if this file is run directly
if (require.main === module) {
    checkPackage();
}

module.exports = checkPackage;
