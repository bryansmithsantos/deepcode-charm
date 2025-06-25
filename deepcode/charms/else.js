/**
 * Else Charm - Simple else block for conditions
 * @module charms/else
 */
const BaseCharm = require('./BaseCharm');

class ElseCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'else';
        this.description = 'Execute code when condition is false';
        this.tier = 1;
        this.examples = [
            '$if[$$value == 10; $say[Equal]]; $else[$say[Not equal]]',
            '$if[$$member.roles.has[admin]]; $else[$say[No access]]'
        ];
    }

    /**
     * Execute the else charm
     * @param {string} code Code to execute
     * @returns {Promise<any>} Result of execution
     */
    async execute(code) {
        // Get the last condition result from context
        const lastCondition = this.client.context.get('lastCondition');
        
        // Only execute if last condition was false
        if (lastCondition === false) {
            return this.client.engine.execute(code);
        }

        return null;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Execute code when the previous condition is false',
        usage: '$else[code]',
        arguments: [{
            name: 'code',
            type: 'string',
            description: 'Code to execute when condition is false'
        }],
        examples: [
            {
                code: '$if[$$points >= 100]; $else[$say[Need more points!]]',
                description: 'Basic else usage'
            },
            {
                code: '$if[$$user.roles.has[admin]]; $else[$sequence[{actions: ["$say[No access]", "$delete[$$message]"]}]]',
                description: 'Complex else block'
            }
        ],
        notes: [
            'Must be used after an if/condition charm',
            'Only executes if previous condition was false',
            'Can be chained with multiple conditions',
            'Supports any charm code as action'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Executa código quando a condição anterior é falsa',
        usage: '$else[código]',
        arguments: [{
            name: 'código',
            type: 'string',
            description: 'Código para executar quando a condição é falsa'
        }],
        examples: [
            {
                code: '$if[$$pontos >= 100]; $else[$say[Precisa de mais pontos!]]',
                description: 'Uso básico do else'
            },
            {
                code: '$if[$$user.roles.has[admin]]; $else[$sequence[{actions: ["$say[Sem acesso]", "$delete[$$message]"]}]]',
                description: 'Bloco else complexo'
            }
        ],
        notes: [
            'Deve ser usado após um charm if/condition',
            'Só executa se a condição anterior for falsa',
            'Pode ser encadeado com múltiplas condições',
            'Suporta qualquer código charm como ação'
        ]
    };
}

module.exports = ElseCharm;
