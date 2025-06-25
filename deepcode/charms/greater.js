/**
 * Greater Charm - Greater than comparison
 * @module charms/greater
 */
const BaseCharm = require('./BaseCharm');

class GreaterCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'greater';
        this.description = 'Compare if value is greater than another';
        this.tier = 1;
        this.examples = [
            '$greater[$$points, 100, $say[High score!]]',
            '$greater[$$member.roles.size, 3, $say[Has many roles], $say[Few roles]]'
        ];
    }

    /**
     * Execute the greater charm
     * @param {Array<string>} args Arguments [value1, value2, thenCode?, elseCode?]
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        // Parse arguments
        const [value1, value2, thenCode, elseCode] = args;

        if (!value1 || !value2) {
            throw new Error('Greater charm requires two values to compare');
        }

        // Convert to condition charm
        return this.client.engine.execute(`$condition[{
            "left": "${value1}",
            "operator": "greater",
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
        description: 'Compare if first value is greater than second',
        usage: '$greater[value1, value2, thenCode?, elseCode?]',
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
            description: 'Code to execute if value1 > value2'
        }, {
            name: 'elseCode',
            type: 'string',
            optional: true,
            description: 'Code to execute if value1 <= value2'
        }],
        examples: [
            {
                code: '$greater[$$level, 10, $role[add; advanced]]',
                description: 'Add role if level is greater than 10'
            },
            {
                code: '$greater[$$money, 1000, $say[Rich!], $say[Need more money]]',
                description: 'Check money with else condition'
            }
        ],
        notes: [
            'Simpler alternative to condition charm for greater than checks',
            'Works with numbers and compatible values',
            'Returns boolean if no then/else code provided',
            'Can be used in calculations and conditions'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Compara se o primeiro valor é maior que o segundo',
        usage: '$greater[valor1, valor2, codigoEntao?, codigoSenao?]',
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
            description: 'Código para executar se valor1 > valor2'
        }, {
            name: 'codigoSenao',
            type: 'string',
            optional: true,
            description: 'Código para executar se valor1 <= valor2'
        }],
        examples: [
            {
                code: '$greater[$$nivel, 10, $role[add; avancado]]',
                description: 'Adiciona cargo se nível for maior que 10'
            },
            {
                code: '$greater[$$dinheiro, 1000, $say[Rico!], $say[Precisa de mais dinheiro]]',
                description: 'Verifica dinheiro com condição else'
            }
        ],
        notes: [
            'Alternativa mais simples ao charm condition para verificações maior que',
            'Funciona com números e valores compatíveis',
            'Retorna booleano se não houver código then/else',
            'Pode ser usado em cálculos e condições'
        ]
    };
}

module.exports = GreaterCharm;
