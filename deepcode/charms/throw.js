/**
 * Throw Charm - Raise custom errors
 * @module charms/throw
 */
const BaseCharm = require('./BaseCharm');

class ThrowCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'throw';
        this.description = 'Raise a custom error';
        this.tier = 2;
        this.examples = [
            '$throw[Invalid permissions]',
            '$throw[{"message": "Invalid input", "code": "E001"}]'
        ];
    }

    /**
     * Execute the throw charm
     * @param {string|Object} args Error message or object
     * @throws {Error} Custom error
     */
    async execute(args) {
        // Handle string error message
        if (typeof args === 'string') {
            throw new Error(args);
        }

        // Handle error object
        if (typeof args === 'object') {
            const error = new Error(args.message || 'Unknown error');
            
            // Add custom properties
            Object.entries(args).forEach(([key, value]) => {
                if (key !== 'message') {
                    error[key] = value;
                }
            });

            throw error;
        }

        throw new Error('Throw charm requires message or error object');
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Raise a custom error with message and properties',
        usage: '$throw[message|errorObject]',
        arguments: [{
            name: 'message',
            type: 'string|object',
            description: 'Error message or object with properties'
        }],
        examples: [
            {
                code: '$throw[Access denied]',
                description: 'Simple error message'
            },
            {
                code: '$throw[{"message": "Invalid role", "code": "ROLE_001", "role": $$role.name}]',
                description: 'Detailed error object'
            },
            {
                code: '$if[$$points < 0; $throw[Points cannot be negative]]',
                description: 'Conditional error'
            }
        ],
        notes: [
            'Can be caught by try charm',
            'Supports string messages',
            'Supports error objects',
            'Preserves error stack',
            'Can include custom properties',
            'Integrates with error handling'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Lança um erro personalizado com mensagem e propriedades',
        usage: '$throw[mensagem|objetoErro]',
        arguments: [{
            name: 'mensagem',
            type: 'string|object',
            description: 'Mensagem de erro ou objeto com propriedades'
        }],
        examples: [
            {
                code: '$throw[Acesso negado]',
                description: 'Mensagem de erro simples'
            },
            {
                code: '$throw[{"message": "Cargo inválido", "code": "ROLE_001", "role": $$role.name}]',
                description: 'Objeto de erro detalhado'
            },
            {
                code: '$if[$$pontos < 0; $throw[Pontos não podem ser negativos]]',
                description: 'Erro condicional'
            }
        ],
        notes: [
            'Pode ser capturado pelo charm try',
            'Suporta mensagens string',
            'Suporta objetos de erro',
            'Preserva stack de erro',
            'Pode incluir propriedades personalizadas',
            'Integra com tratamento de erros'
        ]
    };
}

module.exports = ThrowCharm;
