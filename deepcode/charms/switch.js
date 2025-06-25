/**
 * Switch Charm - Handle multiple value matches
 * @module charms/switch
 */
const BaseCharm = require('./BaseCharm');

class SwitchCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'switch';
        this.description = 'Compare a value against multiple cases';
        this.tier = 1;
        this.examples = [
            '$switch[{"value": "$$role", "cases": {"admin": "$say[Admin]", "mod": "$say[Mod]", "default": "$say[User]"}}]',
            '$switch[{"value": "$$command", "cases": {"help": "$help[]", "play": "$play[$$args]"}}]'
        ];
    }

    /**
     * Execute the switch charm
     * @param {Object} args Switch arguments
     * @param {any} args.value Value to compare
     * @param {Object} args.cases Case matches and code
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        const { value, cases } = args;

        if (!value || !cases) {
            throw new Error('Switch charm requires value and cases');
        }

        // Check if value matches any case
        if (value in cases) {
            return this.client.engine.execute(cases[value]);
        }

        // Execute default case if exists
        if ('default' in cases) {
            return this.client.engine.execute(cases.default);
        }

        return null;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Compare a value against multiple cases and execute matching code',
        usage: '$switch[{"value": value, "cases": {case1: code1, case2: code2, "default": defaultCode}}]',
        arguments: [{
            name: 'value',
            type: 'any',
            description: 'Value to compare against cases'
        }, {
            name: 'cases',
            type: 'object',
            description: 'Object mapping case values to code'
        }],
        examples: [
            {
                code: '$switch[{"value": "$$role", "cases": {"admin": "$say[Admin access]", "mod": "$say[Mod access]", "default": "$say[No access]"}}]',
                description: 'Role-based access control'
            },
            {
                code: '$switch[{"value": "$$command", "cases": {"play": "$play[$$args]", "stop": "$stop[]", "skip": "$skip[]"}}]',
                description: 'Music bot commands'
            },
            {
                code: '$switch[{"value": $$points, "cases": {"100": "$role[add; expert]", "50": "$role[add; intermediate]", "default": "$role[add; beginner]"}}]',
                description: 'Point-based roles'
            }
        ],
        notes: [
            'Cases are checked in order',
            'Default case is optional',
            'Value can be any type',
            'Supports variables and expressions',
            'Cases can contain any charm code'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Compara um valor com múltiplos casos e executa o código correspondente',
        usage: '$switch[{"value": valor, "cases": {caso1: codigo1, caso2: codigo2, "default": codigoPadrao}}]',
        arguments: [{
            name: 'valor',
            type: 'any',
            description: 'Valor para comparar com os casos'
        }, {
            name: 'cases',
            type: 'object',
            description: 'Objeto mapeando valores de caso para código'
        }],
        examples: [
            {
                code: '$switch[{"value": "$$role", "cases": {"admin": "$say[Acesso admin]", "mod": "$say[Acesso mod]", "default": "$say[Sem acesso]"}}]',
                description: 'Controle de acesso baseado em cargo'
            },
            {
                code: '$switch[{"value": "$$command", "cases": {"tocar": "$play[$$args]", "parar": "$stop[]", "pular": "$skip[]"}}]',
                description: 'Comandos de bot de música'
            },
            {
                code: '$switch[{"value": $$pontos, "cases": {"100": "$role[add; expert]", "50": "$role[add; intermediario]", "default": "$role[add; iniciante]"}}]',
                description: 'Cargos baseados em pontos'
            }
        ],
        notes: [
            'Casos são verificados em ordem',
            'Caso padrão é opcional',
            'Valor pode ser de qualquer tipo',
            'Suporta variáveis e expressões',
            'Casos podem conter qualquer código charm'
        ]
    };
}

module.exports = SwitchCharm;
