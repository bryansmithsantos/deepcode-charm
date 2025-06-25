/**
 * Equal Charm - Simple equality comparison
 * @module charms/equal
 */
const BaseCharm = require('./BaseCharm');

class EqualCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'equal';
        this.description = 'Compare values for equality';
        this.tier = 1;
        this.examples = [
            '$equal[$$value, 10, $say[Equal], $say[Not equal]]',
            '$equal[$$author.id, $$owner.id, $say[Is owner]]'
        ];
    }

    /**
     * Execute the equal charm
     * @param {Array<string>} args Arguments [value1, value2, thenCode?, elseCode?]
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        // Parse arguments
        const [value1, value2, thenCode, elseCode] = args;

        if (!value1 || !value2) {
            throw new Error('Equal charm requires two values to compare');
        }

        // Convert to condition charm
        return this.client.engine.execute(`$condition[{
            "left": "${value1}",
            "operator": "equals",
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
        description: 'Compare two values for equality',
        usage: '$equal[value1, value2, thenCode?, elseCode?]',
        arguments: [{
            name: 'value1',
            type: 'any',
            description: 'First value to compare'
        }, {
            name: 'value2',
            type: 'any',
            description: 'Second value to compare'
        }, {
            name: 'thenCode',
            type: 'string',
            optional: true,
            description: 'Code to execute if values are equal'
        }, {
            name: 'elseCode',
            type: 'string',
            optional: true,
            description: 'Code to execute if values are not equal'
        }],
        examples: [
            {
                code: '$equal[$$points, 100, $say[Max points!]]',
                description: 'Check if points equal 100'
            },
            {
                code: '$equal[$$role.name, "Admin", $say[Is admin], $say[Not admin]]',
                description: 'Check role name with else code'
            }
        ],
        notes: [
            'Simpler alternative to condition charm for equality checks',
            'Can be used with or without then/else code',
            'Returns boolean if no then/else code provided',
            'Supports variables and direct values'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Compara dois valores para verificar igualdade',
        usage: '$equal[valor1, valor2, codigoEntao?, codigoSenao?]',
        arguments: [{
            name: 'valor1',
            type: 'any',
            description: 'Primeiro valor para comparar'
        }, {
            name: 'valor2',
            type: 'any',
            description: 'Segundo valor para comparar'
        }, {
            name: 'codigoEntao',
            type: 'string',
            optional: true,
            description: 'Código para executar se os valores forem iguais'
        }, {
            name: 'codigoSenao',
            type: 'string',
            optional: true,
            description: 'Código para executar se os valores não forem iguais'
        }],
        examples: [
            {
                code: '$equal[$$pontos, 100, $say[Pontuação máxima!]]',
                description: 'Verifica se os pontos são iguais a 100'
            },
            {
                code: '$equal[$$cargo.name, "Admin", $say[É admin], $say[Não é admin]]',
                description: 'Verifica nome do cargo com código else'
            }
        ],
        notes: [
            'Alternativa mais simples ao charm condition para verificações de igualdade',
            'Pode ser usado com ou sem código then/else',
            'Retorna booleano se não houver código then/else',
            'Suporta variáveis e valores diretos'
        ]
    };
}

module.exports = EqualCharm;
