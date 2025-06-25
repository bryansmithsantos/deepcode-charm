/**
 * Try Charm - Error handling block
 * @module charms/try
 */
const BaseCharm = require('./BaseCharm');

class TryCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'try';
        this.description = 'Execute code with error handling';
        this.tier = 2;
        this.examples = [
            '$try[{"code": "$data[get; value]", "catch": "$say[Error: $$error]"}]',
            '$try[{"code": "$role[add; user; admin]", "catch": "$log[error; $$error]", "finally": "$say[Done]"}]'
        ];
    }

    /**
     * Execute the try charm
     * @param {Object} args Try block arguments
     * @param {string} args.code Code to try executing
     * @param {string} [args.catch] Code to execute on error
     * @param {string} [args.finally] Code to execute after try/catch
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        const { code, catch: catchCode, finally: finallyCode } = args;

        if (!code) {
            throw new Error('Try charm requires code to execute');
        }

        try {
            // Execute try block
            const result = await this.client.engine.execute(code);
            
            // Execute finally if exists
            if (finallyCode) {
                await this.client.engine.execute(finallyCode);
            }

            return result;
        } catch (error) {
            // Create error context
            const errorContext = {
                error: error.message,
                stack: error.stack,
                code: code,
                type: error.name
            };

            // Execute catch block if exists
            if (catchCode) {
                const result = await this.client.engine.execute(catchCode, errorContext);
                
                // Execute finally if exists
                if (finallyCode) {
                    await this.client.engine.execute(finallyCode);
                }

                return result;
            }

            // Execute finally if exists
            if (finallyCode) {
                await this.client.engine.execute(finallyCode);
            }

            // Re-throw if no catch block
            throw error;
        }
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Execute code with error handling',
        usage: '$try[{"code": code, "catch": catchCode?, "finally": finallyCode?}]',
        arguments: [{
            name: 'code',
            type: 'string',
            description: 'Code to try executing'
        }, {
            name: 'catch',
            type: 'string',
            optional: true,
            description: 'Code to execute if error occurs'
        }, {
            name: 'finally',
            type: 'string',
            optional: true,
            description: 'Code to execute after try/catch'
        }],
        examples: [
            {
                code: '$try[{"code": "$data[get; settings]", "catch": "$sequence[{actions: ["$log[error; $$error]", "$data[set; settings; {}]"]}]"}]',
                description: 'Handle missing data'
            },
            {
                code: '$try[{"code": "$role[add; $$user; admin]", "catch": "$say[Error: $$error]", "finally": "$say[Operation complete]"}]',
                description: 'Role management with cleanup'
            },
            {
                code: '$try[{"code": "$message[delete; $$message.reference.id]", "catch": "$say[Cannot delete message: $$error]"}]',
                description: 'Safe message deletion'
            }
        ],
        notes: [
            'Catch block is optional',
            'Finally block always executes',
            'Provides error context in catch',
            'Re-throws if no catch block',
            'Can be nested',
            'Returns try or catch result'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Executa código com tratamento de erros',
        usage: '$try[{"code": código, "catch": códigoErro?, "finally": códigoFinal?}]',
        arguments: [{
            name: 'code',
            type: 'string',
            description: 'Código para tentar executar'
        }, {
            name: 'catch',
            type: 'string',
            optional: true,
            description: 'Código para executar se ocorrer erro'
        }, {
            name: 'finally',
            type: 'string',
            optional: true,
            description: 'Código para executar após try/catch'
        }],
        examples: [
            {
                code: '$try[{"code": "$data[get; configuracoes]", "catch": "$sequence[{actions: ["$log[error; $$error]", "$data[set; configuracoes; {}]"]}]"}]',
                description: 'Tratar dados ausentes'
            },
            {
                code: '$try[{"code": "$role[add; $$user; admin]", "catch": "$say[Erro: $$error]", "finally": "$say[Operação concluída]"}]',
                description: 'Gerenciamento de cargo com limpeza'
            },
            {
                code: '$try[{"code": "$message[delete; $$message.reference.id]", "catch": "$say[Não foi possível deletar mensagem: $$error]"}]',
                description: 'Deleção segura de mensagem'
            }
        ],
        notes: [
            'Bloco catch é opcional',
            'Bloco finally sempre executa',
            'Fornece contexto de erro no catch',
            'Re-lança erro se não houver catch',
            'Pode ser aninhado',
            'Retorna resultado do try ou catch'
        ]
    };
}

module.exports = TryCharm;
