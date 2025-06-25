/**
 * ForEach Charm - Simple array iteration
 * @module charms/foreach
 */
const BaseCharm = require('./BaseCharm');

class ForEachCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'foreach';
        this.description = 'Iterate over array elements with simplified syntax';
        this.tier = 2;
        this.examples = [
            '$foreach[$$members; $say[Member: $$value.tag]]',
            '$foreach[$$roles; $data[set; roles.$$value.id; {name: $$value.name}]]'
        ];
    }

    /**
     * Execute the foreach charm
     * @param {Array<string>} args Arguments [array, code]
     * @returns {Promise<any[]>} Array of results
     */
    async execute(args) {
        const [arrayArg, code] = args;

        if (!arrayArg || !code) {
            throw new Error('ForEach charm requires array and code');
        }

        // Get array from argument
        const array = await this.client.engine.execute(`$array[get; ${arrayArg}]`);
        
        if (!Array.isArray(array)) {
            throw new Error('ForEach charm requires array input');
        }

        // Create loop context
        const loopContext = {
            type: 'foreach',
            array,
            index: 0,
            break: false,
            reason: ''
        };

        this.client.context.set('currentLoop', loopContext);

        const results = [];

        // Iterate array
        for (let i = 0; i < array.length; i++) {
            // Update context
            loopContext.index = i;
            loopContext.value = array[i];

            // Execute code with context
            const context = {
                value: array[i],
                index: i,
                array,
                total: array.length,
                first: i === 0,
                last: i === array.length - 1
            };

            const result = await this.client.engine.execute(code, context);
            results.push(result);

            // Check for break
            if (loopContext.break) {
                break;
            }
        }

        // Clean up context
        this.client.context.delete('currentLoop');

        return results;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Iterate over array elements with simplified syntax',
        usage: '$foreach[array; code]',
        arguments: [{
            name: 'array',
            type: 'array',
            description: 'Array to iterate over'
        }, {
            name: 'code',
            type: 'string',
            description: 'Code to execute for each element'
        }],
        examples: [
            {
                code: '$foreach[$$members; $role[add; $$value; member]]',
                description: 'Add role to all members'
            },
            {
                code: '$foreach[$$messages; $sequence[{actions: ["$if[$$value.pinned; $break[]]", "$message[delete; $$value.id]"]}]]',
                description: 'Delete messages until pinned'
            },
            {
                code: '$foreach[$$roles; $if[$$value.name == "Admin"; $say[Found admin role at $$index]]]',
                description: 'Find admin role'
            }
        ],
        notes: [
            'Simpler syntax than loop charm',
            'Provides $$value and $$index variables',
            'Also provides $$first and $$last flags',
            'Supports break charm',
            'Returns array of results',
            'Works with any array type'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Itera sobre elementos de array com sintaxe simplificada',
        usage: '$foreach[array; código]',
        arguments: [{
            name: 'array',
            type: 'array',
            description: 'Array para iterar'
        }, {
            name: 'código',
            type: 'string',
            description: 'Código para executar para cada elemento'
        }],
        examples: [
            {
                code: '$foreach[$$members; $role[add; $$value; membro]]',
                description: 'Adicionar cargo a todos os membros'
            },
            {
                code: '$foreach[$$messages; $sequence[{actions: ["$if[$$value.pinned; $break[]]", "$message[delete; $$value.id]"]}]]',
                description: 'Deletar mensagens até encontrar fixada'
            },
            {
                code: '$foreach[$$roles; $if[$$value.name == "Admin"; $say[Cargo admin encontrado em $$index]]]',
                description: 'Encontrar cargo admin'
            }
        ],
        notes: [
            'Sintaxe mais simples que o charm loop',
            'Fornece variáveis $$value e $$index',
            'Também fornece flags $$first e $$last',
            'Suporta charm break',
            'Retorna array de resultados',
            'Funciona com qualquer tipo de array'
        ]
    };
}

module.exports = ForEachCharm;
