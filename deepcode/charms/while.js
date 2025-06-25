/**
 * While Charm - Conditional loop execution
 * @module charms/while
 */
const BaseCharm = require('./BaseCharm');

class WhileCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'while';
        this.description = 'Execute code while a condition is true';
        this.tier = 2;
        this.examples = [
            '$while[{"condition": "$$count < 5", "code": "$data[add; count; 1]"}]',
            '$while[{"condition": "$$message.reactions.size < 3", "code": "$wait[1s]", "timeout": 60}]'
        ];
    }

    /**
     * Execute the while charm
     * @param {Object} args While arguments
     * @param {string} args.condition Condition to check
     * @param {string} args.code Code to execute
     * @param {number} [args.timeout=30] Maximum execution time in seconds
     * @param {number} [args.maxIterations=100] Maximum number of iterations
     * @returns {Promise<any[]>} Array of results
     */
    async execute(args) {
        const { condition, code, timeout = 30, maxIterations = 100 } = args;

        if (!condition || !code) {
            throw new Error('While charm requires condition and code');
        }

        const results = [];
        let iterations = 0;
        const startTime = Date.now();
        const timeoutMs = timeout * 1000;

        while (true) {
            // Check timeout
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`While charm timed out after ${timeout} seconds`);
            }

            // Check max iterations
            if (iterations >= maxIterations) {
                throw new Error(`While charm exceeded maximum iterations (${maxIterations})`);
            }

            // Check condition
            const conditionResult = await this.client.engine.execute(`$condition[{
                "left": "${condition}",
                "operator": "equals",
                "right": "true"
            }]`);

            if (!conditionResult) {
                break;
            }

            // Execute code
            const context = {
                iteration: iterations,
                startTime,
                elapsedTime: Date.now() - startTime
            };

            const result = await this.client.engine.execute(code, context);
            results.push(result);

            iterations++;
        }

        return results;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Execute code repeatedly while a condition is true',
        usage: '$while[{"condition": condition, "code": code, "timeout": seconds?, "maxIterations": number?}]',
        arguments: [{
            name: 'condition',
            type: 'string',
            description: 'Condition to check each iteration'
        }, {
            name: 'code',
            type: 'string',
            description: 'Code to execute while condition is true'
        }, {
            name: 'timeout',
            type: 'number',
            optional: true,
            description: 'Maximum execution time in seconds (default: 30)'
        }, {
            name: 'maxIterations',
            type: 'number',
            optional: true,
            description: 'Maximum number of iterations (default: 100)'
        }],
        examples: [
            {
                code: '$while[{"condition": "$$users.size < 10", "code": "$wait[1s]", "timeout": 60}]',
                description: 'Wait for 10 users (max 1 minute)'
            },
            {
                code: '$while[{"condition": "$$data[get; points] < 100", "code": "$sequence[{actions: ["$say[Grinding...]", "$data[add; points; 5]"]}]"}]',
                description: 'Grind points until reaching 100'
            },
            {
                code: '$while[{"condition": "$$message.reactions.size == 0", "code": "$wait[5s]", "timeout": 30, "maxIterations": 6}]',
                description: 'Wait for reactions (max 30 seconds)'
            }
        ],
        notes: [
            'Has timeout to prevent infinite loops',
            'Limited maximum iterations for safety',
            'Condition is checked before each iteration',
            'Provides iteration count in context',
            'Returns array of results from each iteration',
            'Can use any charm code in condition and execution'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Executa código repetidamente enquanto uma condição for verdadeira',
        usage: '$while[{"condition": condição, "code": código, "timeout": segundos?, "maxIterations": número?}]',
        arguments: [{
            name: 'condition',
            type: 'string',
            description: 'Condição para verificar a cada iteração'
        }, {
            name: 'code',
            type: 'string',
            description: 'Código para executar enquanto condição for verdadeira'
        }, {
            name: 'timeout',
            type: 'number',
            optional: true,
            description: 'Tempo máximo de execução em segundos (padrão: 30)'
        }, {
            name: 'maxIterations',
            type: 'number',
            optional: true,
            description: 'Número máximo de iterações (padrão: 100)'
        }],
        examples: [
            {
                code: '$while[{"condition": "$$users.size < 10", "code": "$wait[1s]", "timeout": 60}]',
                description: 'Esperar por 10 usuários (máx 1 minuto)'
            },
            {
                code: '$while[{"condition": "$$data[get; pontos] < 100", "code": "$sequence[{actions: ["$say[Farmando...]", "$data[add; pontos; 5]"]}]"}]',
                description: 'Farmar pontos até chegar a 100'
            },
            {
                code: '$while[{"condition": "$$message.reactions.size == 0", "code": "$wait[5s]", "timeout": 30, "maxIterations": 6}]',
                description: 'Esperar por reações (máx 30 segundos)'
            }
        ],
        notes: [
            'Tem timeout para evitar loops infinitos',
            'Limita número máximo de iterações por segurança',
            'Condição é verificada antes de cada iteração', 
            'Fornece contador de iteração no contexto',
            'Retorna array com resultados de cada iteração',
            'Pode usar qualquer código charm na condição e execução'
        ]
    };
}

module.exports = WhileCharm;
