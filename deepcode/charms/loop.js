/**
 * Loop Charm - Handle repetitive operations
 * @module charms/loop
 */
const BaseCharm = require('./BaseCharm');

class LoopCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'loop';
        this.description = 'Execute code multiple times or over arrays';
        this.tier = 2;
        this.examples = [
            '$loop[{"times": 5, "code": "$say[$$index]"}]',
            '$loop[{"array": "$$members", "code": "$role[add; $$value; newbie]"}]'
        ];
    }

    /**
     * Execute the loop charm
     * @param {Object} args Loop arguments
     * @param {number} [args.times] Number of iterations
     * @param {Array} [args.array] Array to iterate over
     * @param {string} args.code Code to execute
     * @param {boolean} [args.async=false] Run iterations asynchronously
     * @returns {Promise<any[]>} Array of results
     */
    async execute(args) {
        const { times, array, code, async = false } = args;

        if (!code) {
            throw new Error('Loop charm requires code to execute');
        }

        // Array iteration
        if (array) {
            const items = Array.isArray(array) ? array : [array];
            const results = [];

            // Execute for each item
            if (async) {
                // Run all iterations in parallel
                results.push(...await Promise.all(items.map(async (value, index) => {
                    const context = { value, index, array: items };
                    return this.client.engine.execute(code, context);
                })));
            } else {
                // Run iterations sequentially
                for (let i = 0; i < items.length; i++) {
                    const context = {
                        value: items[i],
                        index: i,
                        array: items
                    };
                    results.push(await this.client.engine.execute(code, context));
                }
            }

            return results;
        }

        // Numeric iteration
        if (times && times > 0) {
            const iterations = parseInt(times);
            const results = [];

            if (async) {
                // Run all iterations in parallel
                const promises = [];
                for (let i = 0; i < iterations; i++) {
                    const context = { index: i, total: iterations };
                    promises.push(this.client.engine.execute(code, context));
                }
                results.push(...await Promise.all(promises));
            } else {
                // Run iterations sequentially
                for (let i = 0; i < iterations; i++) {
                    const context = {
                        index: i,
                        total: iterations
                    };
                    results.push(await this.client.engine.execute(code, context));
                }
            }

            return results;
        }

        throw new Error('Loop charm requires times or array parameter');
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Execute code multiple times or iterate over arrays',
        usage: '$loop[{"times": number, "array": array?, "code": code, "async": boolean?}]',
        arguments: [{
            name: 'times',
            type: 'number',
            optional: true,
            description: 'Number of times to execute code'
        }, {
            name: 'array',
            type: 'array',
            optional: true,
            description: 'Array to iterate over'
        }, {
            name: 'code',
            type: 'string',
            description: 'Code to execute each iteration'
        }, {
            name: 'async',
            type: 'boolean',
            optional: true,
            description: 'Run iterations asynchronously'
        }],
        examples: [
            {
                code: '$loop[{"times": 3, "code": "$say[Message $$index]"}]',
                description: 'Send 3 numbered messages'
            },
            {
                code: '$loop[{"array": "$$members", "code": "$data[add; points.$$value.id; 10]"}]',
                description: 'Add points to all members'
            },
            {
                code: '$loop[{"array": "$$roles", "code": "$sequence[{actions: ["$say[Role: $$value.name]", "$data[set; role.$$value.id; {name: $$value.name}]"]}]", "async": true}]',
                description: 'Process roles asynchronously'
            }
        ],
        notes: [
            'Must specify either times or array',
            'Variables available in code: $$index, $$value, $$total',
            'Array iteration provides $$value and $$index',
            'Times iteration provides $$index and $$total',
            'Async mode runs all iterations in parallel',
            'Returns array of results from each iteration'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Executa código múltiplas vezes ou itera sobre arrays',
        usage: '$loop[{"times": número, "array": array?, "code": código, "async": booleano?}]',
        arguments: [{
            name: 'times',
            type: 'number',
            optional: true,
            description: 'Número de vezes para executar o código'
        }, {
            name: 'array',
            type: 'array',
            optional: true,
            description: 'Array para iterar'
        }, {
            name: 'code',
            type: 'string',
            description: 'Código para executar em cada iteração'
        }, {
            name: 'async',
            type: 'boolean',
            optional: true,
            description: 'Executar iterações assincronamente'
        }],
        examples: [
            {
                code: '$loop[{"times": 3, "code": "$say[Mensagem $$index]"}]',
                description: 'Enviar 3 mensagens numeradas'
            },
            {
                code: '$loop[{"array": "$$members", "code": "$data[add; pontos.$$value.id; 10]"}]',
                description: 'Adicionar pontos a todos os membros'
            },
            {
                code: '$loop[{"array": "$$roles", "code": "$sequence[{actions: ["$say[Cargo: $$value.name]", "$data[set; cargo.$$value.id; {nome: $$value.name}]"]}]", "async": true}]',
                description: 'Processar cargos assincronamente'
            }
        ],
        notes: [
            'Deve especificar times ou array',
            'Variáveis disponíveis no código: $$index, $$value, $$total',
            'Iteração de array fornece $$value e $$index',
            'Iteração numérica fornece $$index e $$total',
            'Modo async executa todas iterações em paralelo',
            'Retorna array com resultados de cada iteração'
        ]
    };
}

module.exports = LoopCharm;
