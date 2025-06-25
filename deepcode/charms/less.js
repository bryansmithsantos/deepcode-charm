/**
 * Less Charm - Less than comparison
 * @module charms/less
 */
const BaseCharm = require('./BaseCharm');

class LessCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'less';
        this.description = 'Compare if value is less than another';
        this.tier = 1;
        this.examples = [
            '$less[$$points, 100, $say[Keep trying!]]',
            '$less[$$member.roles.size, 3, $say[Needs more roles], $say[Has enough roles]]'
        ];
    }

    /**
     * Execute the less charm
     * @param {Array<string>} args Arguments [value1, value2, thenCode?, elseCode?]
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        // Parse arguments
        const [value1, value2, thenCode, elseCode] = args;

        if (!value1 || !value2) {
            throw new Error('Less charm requires two values to compare');
        }

        // Convert to condition charm
        return this.client.engine.execute(`$condition[{
            "left": "${value1}",
            "operator": "less",
            "right": "${value2}"${thenCode ? `,
            "then": "${thenCode}"` : ''}${elseCode ? `,
            "else": "${elseCode}"` : ''}
        }]`);
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Compare if first value is less than second',
        usage: '$less[value1, value2, thenCode?, elseCode?]',
        arguments: [{
            name: 'value1',
            type: 'number',
            description: 'First value to compare'
        }, {
            name: 'value2',
            type: 'number',
            description: 'Second value to compare against'
        }, {
            name: 'thenCode',
            type: 'string',
            optional: true,
            description: 'Code to execute if value1 < value2'
        }, {
            name: 'elseCode',
            type: 'string',
            optional: true,
            description: 'Code to execute if value1 >= value2'
        }],
        examples: [
            {
                code: '$less[$$level, 5, $say[Need more levels!]]',
                description: 'Check if level is less than 5'
            },
            {
                code: '$less[$$health, 50, $role[add; wounded], $role[remove; wounded]]',
                description: 'Manage wounded role based on health'
            }
        ],
        notes: [
            'Simpler alternative to condition charm for less than checks',
            'Works with numbers and compatible values',
            'Returns boolean if no then/else code provided',
            'Can be used in calculations and conditions'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Compara se o primeiro valor é menor que o segundo',
        usage: '$less[valor1, valor2, codigoEntao?, codigoSenao?]',
        arguments: [{
            name: 'valor1',
            type: 'number',
            description: 'Primeiro valor para comparar'
        }, {
            name: 'valor2',
            type: 'number',
            description: 'Segundo valor para comparar'
        }, {
            name: 'codigoEntao',
            type: 'string',
            optional: true,
            description: 'Código para executar se valor1 < valor2'
        }, {
            name: 'codigoSenao',
            type: 'string',
            optional: true,
            description: 'Código para executar se valor1 >= valor2'
        }],
        examples: [
            {
                code: '$less[$$nivel, 5, $say[Precisa de mais níveis!]]',
                description: 'Verifica se o nível é menor que 5'
            },
            {
                code: '$less[$$vida, 50, $role[add; ferido], $role[remove; ferido]]',
                description: 'Gerencia cargo ferido baseado na vida'
            }
        ],
        notes: [
            'Alternativa mais simples ao charm condition para verificações menor que',
            'Funciona com números e valores compatíveis',
            'Retorna booleano se não houver código then/else',
            'Pode ser usado em cálculos e condições'
        ]
    };
}

module.exports = LessCharm;
