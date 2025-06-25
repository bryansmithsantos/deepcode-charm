/**
 * Break Charm - Exit from loops
 * @module charms/break
 */
const BaseCharm = require('./BaseCharm');

class BreakCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'break';
        this.description = 'Exit from the current loop';
        this.tier = 2;
        this.examples = [
            '$loop[{"array": "$$members", "code": "$if[$$value.bot; $break[]]}]',
            '$while[{"condition": "true", "code": "$if[$$data[get; stop]; $break[]]"}]'
        ];
    }

    /**
     * Execute the break charm
     * @param {string} [reason] Optional reason for breaking
     * @returns {Promise<void>}
     */
    async execute(reason = '') {
        // Get the current loop context
        const loopContext = this.client.context.get('currentLoop');
        
        if (!loopContext) {
            throw new Error('Break charm can only be used inside a loop');
        }

        // Signal loop to stop
        loopContext.break = true;
        loopContext.reason = reason;

        // Remove loop context
        this.client.context.delete('currentLoop');
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Exit from the current loop immediately',
        usage: '$break[reason?]',
        arguments: [{
            name: 'reason',
            type: 'string',
            optional: true,
            description: 'Optional reason for breaking the loop'
        }],
        examples: [
            {
                code: '$loop[{"array": "$$users", "code": "$sequence[{actions: ["$if[$$value.bot; $break[Bot found]]", "$say[User: $$value.tag]"]}]"}]',
                description: 'Stop on first bot'
            },
            {
                code: '$while[{"condition": "$$count < 10", "code": "$if[$$data[get; stop]; $break[Stopped by user]]; $data[add; count; 1]"}]',
                description: 'Break loop when stop flag is set'
            },
            {
                code: '$foreach[$$members; $sequence[{actions: ["$if[$$value.roles.size == 0; $break[No roles]]", "$role[add; $$value; member]"]}]]',
                description: 'Skip members without roles'
            }
        ],
        notes: [
            'Must be used inside a loop charm',
            'Stops loop execution immediately',
            'Can provide reason for breaking',
            'Works with loop, while, and foreach',
            'Cleans up loop context automatically'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Sair do loop atual imediatamente',
        usage: '$break[razão?]',
        arguments: [{
            name: 'razão',
            type: 'string',
            optional: true,
            description: 'Razão opcional para sair do loop'
        }],
        examples: [
            {
                code: '$loop[{"array": "$$users", "code": "$sequence[{actions: ["$if[$$value.bot; $break[Bot encontrado]]", "$say[Usuário: $$value.tag]"]}]"}]',
                description: 'Parar no primeiro bot'
            },
            {
                code: '$while[{"condition": "$$count < 10", "code": "$if[$$data[get; parar]; $break[Parado pelo usuário]]; $data[add; count; 1]"}]',
                description: 'Interromper loop quando flag de parada é definida'
            },
            {
                code: '$foreach[$$members; $sequence[{actions: ["$if[$$value.roles.size == 0; $break[Sem cargos]]", "$role[add; $$value; membro]"]}]]',
                description: 'Pular membros sem cargos'
            }
        ],
        notes: [
            'Deve ser usado dentro de um charm de loop',
            'Para a execução do loop imediatamente',
            'Pode fornecer razão para parar',
            'Funciona com loop, while e foreach',
            'Limpa o contexto do loop automaticamente'
        ]
    };
}

module.exports = BreakCharm;
