/**
 * ElseIf Charm - Handle multiple conditions
 * @module charms/elseif
 */
const BaseCharm = require('./BaseCharm');

class ElseIfCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'elseif';
        this.description = 'Check another condition when previous is false';
        this.tier = 1;
        this.examples = [
            '$if[$$points > 100; $say[High]]; $elseif[$$points > 50; $say[Medium]]; $else[$say[Low]]',
            '$if[$$role == "admin"]; $elseif[$$role == "mod"; $say[Mod access]]'
        ];
    }

    /**
     * Execute the elseif charm
     * @param {Array<string>} args Arguments [condition, code]
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        // Get the last condition result from context
        const lastCondition = this.client.context.get('lastCondition');
        
        // Only execute if last condition was false
        if (lastCondition === false) {
            // Split into condition and code
            const [condition, code] = args;

            // Convert to condition charm syntax
            const result = await this.client.engine.execute(`$condition[{
                "left": "${condition}",
                "then": "${code}"
            }]`);

            // Store result for next else/elseif
            this.client.context.set('lastCondition', result);

            return result;
        }

        return null;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Test another condition when previous condition is false',
        usage: '$elseif[condition; code]',
        arguments: [{
            name: 'condition',
            type: 'string',
            description: 'Condition to test'
        }, {
            name: 'code',
            type: 'string',
            description: 'Code to execute if condition is true'
        }],
        examples: [
            {
                code: '$if[$$level >= 100; $say[Max level]]; $elseif[$$level >= 50; $say[High level]]; $else[$say[Low level]]',
                description: 'Multiple level checks'
            },
            {
                code: '$if[$$user.roles.has[admin]]; $elseif[$$user.roles.has[mod]; $sequence[{actions: ["$say[Mod powers]", "$role[add; helper]"]}]]',
                description: 'Complex role checks'
            }
        ],
        notes: [
            'Must be used after an if or another elseif charm',
            'Only executes if previous condition was false',
            'Can be chained multiple times',
            'Can use complex conditions',
            'Works with $else at the end'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Testa outra condição quando a condição anterior é falsa',
        usage: '$elseif[condição; código]',
        arguments: [{
            name: 'condição',
            type: 'string',
            description: 'Condição para testar'
        }, {
            name: 'código',
            type: 'string',
            description: 'Código para executar se a condição for verdadeira'
        }],
        examples: [
            {
                code: '$if[$$nivel >= 100; $say[Nível máximo]]; $elseif[$$nivel >= 50; $say[Nível alto]]; $else[$say[Nível baixo]]',
                description: 'Múltiplas verificações de nível'
            },
            {
                code: '$if[$$user.roles.has[admin]]; $elseif[$$user.roles.has[mod]; $sequence[{actions: ["$say[Poderes de mod]", "$role[add; ajudante]"]}]]',
                description: 'Verificações complexas de cargo'
            }
        ],
        notes: [
            'Deve ser usado após um if ou outro elseif',
            'Só executa se a condição anterior for falsa',
            'Pode ser encadeado múltiplas vezes',
            'Pode usar condições complexas',
            'Funciona com $else no final'
        ]
    };
}

module.exports = ElseIfCharm;
