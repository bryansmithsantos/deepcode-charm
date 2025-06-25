/**
 * Documentation Generator Script
 * Generates all documentation using the template engine
 */
const DocTemplate = require('../docs/templates/engine');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const config = {
    baseTemplate: path.join(__dirname, '../docs/templates/base.html'),
    outputDir: path.join(__dirname, '../docs'),
    charmsDir: path.join(__dirname, '../charms'),
    docsMap: {
        // Main pages
        'index': { title: 'Home' },
        'charms': { title: 'Charms' },
        'events': { title: 'Events' },
        'plugins': { title: 'Plugins' },
        'cli': { title: 'CLI Tools' },
        'advanced': { title: 'Advanced Usage' },
        'faq': { title: 'FAQ' }
    }
};

class DocsGenerator {
    constructor() {
        this.template = new DocTemplate(config.baseTemplate);
    }

    /**
     * Generate all documentation
     */
    async generate() {
        console.log('Generating documentation...');
        
        try {
            // Ensure output directory exists
            await fs.mkdir(config.outputDir, { recursive: true });

            // Generate main pages
            await this.generateMainPages();

            // Generate charm documentation
            await this.generateCharmDocs();

            console.log('Documentation generated successfully!');
        } catch (error) {
            console.error('Error generating documentation:', error);
            process.exit(1);
        }
    }

    /**
     * Generate main documentation pages
     */
    async generateMainPages() {
        for (const [name, data] of Object.entries(config.docsMap)) {
            console.log(`Generating ${name} page...`);
            
            const outputPath = path.join(config.outputDir, `${name}.html`);
            const contentPath = path.join(config.outputDir, `${name}.content.html`);

            try {
                // Check if content file exists
                const hasContent = await fs.access(contentPath)
                    .then(() => true)
                    .catch(() => false);

                if (hasContent) {
                    const content = await fs.readFile(contentPath, 'utf-8');
                    await this.template.generatePage({
                        title: data.title,
                        content
                    }, outputPath);
                } else {
                    console.warn(`Warning: No content file found for ${name}`);
                }
            } catch (error) {
                console.error(`Error generating ${name} page:`, error);
            }
        }
    }

    /**
     * Generate charm documentation
     */
    async generateCharmDocs() {
        console.log('Generating charm documentation...');

        // Get all charm files
        const charmFiles = await fs.readdir(config.charmsDir);
        const charms = [];

        // Load all charms
        for (const file of charmFiles) {
            if (!file.endsWith('.js')) continue;

            try {
                const CharmClass = require(path.join(config.charmsDir, file));
                if (CharmClass.documentation) {
                    charms.push({
                        name: file.replace('.js', ''),
                        ...CharmClass
                    });
                }
            } catch (error) {
                console.error(`Error loading charm ${file}:`, error);
            }
        }

        // Sort charms by tier then name
        charms.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.name.localeCompare(b.name);
        });

        // Generate individual charm pages
        for (const charm of charms) {
            console.log(`Generating documentation for ${charm.name} charm...`);
            
            const outputPath = path.join(config.outputDir, 'charms', `${charm.name}.html`);
            await this.template.generateCharmDocs(charm, outputPath);
        }

        // Generate charm index
        await this.generateCharmIndex(charms);
    }

    /**
     * Generate charm index page
     */
    async generateCharmIndex(charms) {
        const content = `
            <div lang="en">
                <h1>Charms Reference</h1>
                ${[1, 2, 3].map(tier => `
                    <h2>Tier ${tier} Charms</h2>
                    <div class="charm-grid">
                        ${charms
                            .filter(c => c.tier === tier)
                            .map(charm => `
                                <div class="charm-card">
                                    <h3>${charm.name}</h3>
                                    <p>${charm.documentation.description}</p>
                                    <a href="/docs/charms/${charm.name}.html">Learn More</a>
                                </div>
                            `).join('')}
                    </div>
                `).join('')}
            </div>

            <div lang="pt" style="display: none;">
                <h1>Referência de Charms</h1>
                ${[1, 2, 3].map(tier => `
                    <h2>Charms Nível ${tier}</h2>
                    <div class="charm-grid">
                        ${charms
                            .filter(c => c.tier === tier)
                            .map(charm => `
                                <div class="charm-card">
                                    <h3>${charm.name}</h3>
                                    <p>${charm.ptDocs.description}</p>
                                    <a href="/docs/charms/${charm.name}.html">Saiba Mais</a>
                                </div>
                            `).join('')}
                    </div>
                `).join('')}
            </div>
        `;

        await this.template.generatePage({
            title: 'Charms Reference',
            content
        }, path.join(config.outputDir, 'charms.html'));
    }
}

// Run generator
if (require.main === module) {
    const generator = new DocsGenerator();
    generator.generate();
}

module.exports = DocsGenerator;
