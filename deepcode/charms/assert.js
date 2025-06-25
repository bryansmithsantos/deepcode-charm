/**
 * Assert Charm - Runtime validation and checks 
 * @module charms/assert
 */
const BaseCharm = require('./BaseCharm');

class AssertCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'assert';
        this.description = 'Verify conditions and throw errors if they fail';
        this.tier = 2;
        this.examples = [
            '$assert[$$points >= 0; Points must be positive]',
            '$assert[{"condition": "$$user.roles.has[admin]", "message": "Admin access required", "code": "E403"}]'
        ];
    }

    /**
     * Execute the assert charm
     * @param {Array<string>|Object} args Assert arguments
     * @param {string} [args.condition] Condition to check
     * @param {string} [args.message] Error message
     * @param {Object} [args.error] Custom error properties
     * @throws {Error} Assertion error if condition fails
     */
    async execute(args) {
        let condition, message, error;

        // Handle array syntax: [condition, message]
        if (Array.isArray(args)) {
            [condition, message] = args;
        } 
        // Handle object syntax: {condition, message, error}
        else if (typeof args === 'object') {
            ({ condition, message, error } = args);
        }
        else {
            throw new Error('Assert charm requires condition and message');
        }

        if (!condition) {
            throw new Error('Assert charm requires condition');
        }

        // Evaluate condition
        const result = await this.client.engine.execute(`$condition[{
            "left": "${condition}",
            "operator": "equals",
            "right": "true"
        }]`);

        // Throw if condition fails
        if (!result) {
            if (error) {
                const customError = new Error(message || error.message || 'Assertion failed');
                Object.entries(error).forEach(([key, value]) => {
                    if (key !== 'message') {
                        customError[key] = value;
                    }
                });
                throw customError;
            } else {
                throw new Error(message || 'Assertion failed');
            }
        }

        return true;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Verify conditions and throw errors if they fail',
        usage: '$assert[condition; message] or $assert[{condition, message, error}]',
        arguments: [{
            name: 'condition',
            type: 'string',
            description: 'Condition to verify'
        }, {
            name: 'message',
            type: 'string',
            optional: true,
            description: 'Error message if assertion fails'
        }, {
            name: 'error',
            type: 'object',
            optional: true,
            description: 'Custom error properties'
        }],
        examples: [
            {
                code: '$assert[$$member.roles.size > 0; Member must have roles]',
                description: 'Basic role check'
            },
            {
                code: '$assert[{"condition": "$$points >= 0", "message": "Invalid points", "error": {"code": "POINTS_001", "value": $$points}}]',
                description: 'Detailed error with metadata'
            },
            {
                code: '$try[{code: "$assert[$$balance >= $$amount; Insufficient funds]", catch: "$say[Error: $$error]"}]',
                description: 'Validation with error handling'
            }
        ],
        notes: [
            'Supports simple and detailed syntax',
            'Can include custom error data',
            'Works with try/catch blocks',
            'Useful for input validation',
            'Can check complex conditions',
            'Helps with defensive programming'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Verifica condições e lança erros se falharem',
        usage: '$assert[condição; mensagem] ou $assert[{condition, message, error}]',
        arguments: [{
            name: 'condition',
            type: 'string',
            description: 'Condição para verificar'
        }, {
            name: 'message',
            type: 'string',
            optional: true,
            description: 'Mensagem de erro se asserção falhar'
        }, {
            name: 'error',
            type: 'object',
            optional: true,
            description: 'Propriedades customizadas do erro'
        }],
        examples: [
            {
                code: '$assert[$$member.roles.size > 0; Membro deve ter cargos]',
                description: 'Verificação básica de cargo'
            },
            {
                code: '$assert[{"condition": "$$pontos >= 0", "message": "Pontos inválidos", "error": {"code": "POINTS_001", "value": $$pontos}}]',
                description: 'Erro detalhado com metadados'
            },
            {
                code: '$try[{code: "$assert[$$saldo >= $$valor; Saldo insuficiente]", catch: "$say[Erro: $$error]"}]',
                description: 'Validação com tratamento de erro'
            }
        ],
        notes: [
            'Suporta sintaxe simples e detalhada',
            'Pode incluir dados de erro personalizados',
            'Funciona com blocos try/catch',
            'Útil para validação de entrada',
            'Pode verificar condições complexas',
            'Ajuda na programação defensiva'
        ]
    };
}

module.exports = AssertCharm;
