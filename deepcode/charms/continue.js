/**
 * Continue Charm - Skip to next iteration
 * @module charms/continue
 */
const BaseCharm = require('./BaseCharm');

class ContinueCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'continue';
        this.description = 'Skip to the next iteration in a loop';
        this.tier = 2;
        this.examples = [
            '$foreach[$$members; $if[$$value.bot; $continue[]]; $role[add; member]]',
            '$loop[{"times": 5, "code": "$if[$$index == 2; $continue[]]; $say[$$index]"}]'
        ];
    }

    /**
     * Execute the continue charm
     * @param {string} [reason] Optional reason for continuing
     * @returns {Promise<void>}
     */
    async execute(reason = '') {
        // Get the current loop context
        const loopContext = this.client.context.get('currentLoop');
        
        if (!loopContext) {
            throw new Error('Continue charm can only be used inside a loop');
        }

        // Signal loop to continue
        loopContext.continue = true;
        loopContext.reason = reason;

        // Store reason but keep context for next iteration
        this.client.context.set('continueReason', reason);
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Skip to the next iteration in a loop',
        usage: '$continue[reason?]',
        arguments: [{
            name: 'reason',
            type: 'string',
            optional: true,
            description: 'Optional reason for skipping iteration'
        }],
        examples: [
            {
                code: '$foreach[$$users; $sequence[{actions: ["$if[$$value.bot; $continue[Bot skipped]]", "$say[User: $$value.tag]"]}]]',
                description: 'Skip bot users'
            },
            {
                code: '$while[{"condition": "$$count < 10", "code": "$if[$$data[get; skip]; $continue[Skip]]; $data[add; count; 1]"}]',
                description: 'Skip iterations when flag is set'
            },
            {
                code: '$loop[{"array": "$$roles", "code": "$if[$$value.managed; $continue[System role]]; $role[delete; $$value.id]"}]',
                description: 'Skip system-managed roles'
            }
        ],
        notes: [
            'Must be used inside a loop charm',
            'Skips remaining code in current iteration',
            'Continues with next iteration',
            'Can provide skip reason',
            'Works with all loop types',
            'Preserves loop context'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Pular para a próxima iteração em um loop',
        usage: '$continue[razão?]',
        arguments: [{
            name: 'razão',
            type: 'string',
            optional: true,
            description: 'Razão opcional para pular iteração'
        }],
        examples: [
            {
                code: '$foreach[$$users; $sequence[{actions: ["$if[$$value.bot; $continue[Bot pulado]]", "$say[Usuário: $$value.tag]"]}]]',
                description: 'Pular usuários bot'
            },
            {
                code: '$while[{"condition": "$$count < 10", "code": "$if[$$data[get; pular]; $continue[Pular]]; $data[add; count; 1]"}]',
                description: 'Pular iterações quando flag está definida'
            },
            {
                code: '$loop[{"array": "$$roles", "code": "$if[$$value.managed; $continue[Cargo do sistema]]; $role[delete; $$value.id]"}]',
                description: 'Pular cargos gerenciados pelo sistema'
            }
        ],
        notes: [
            'Deve ser usado dentro de um charm de loop',
            'Pula código restante na iteração atual',
            'Continua com próxima iteração',
            'Pode fornecer razão para pular',
            'Funciona com todos os tipos de loop',
            'Preserva contexto do loop'
        ]
    };
}

module.exports = ContinueCharm;
