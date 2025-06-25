/**
 * If Charm - Conditional execution with simpler syntax
 * @module charms/if
 */
const BaseCharm = require('./BaseCharm');

class IfCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'if';
        this.description = 'Simple conditional execution';
        this.tier = 1;
        this.examples = [
            '$if[$$value == 10; $say[Equal to 10]; $say[Not equal to 10]]',
            '$if[$$author.bot; $stop[]]',
            '$if[$$member.roles.has[admin]; $say[Is admin]]'
        ];
    }

    /**
     * Execute the if charm
     * @param {string} args Condition and code blocks
     * @returns {Promise<any>} Result of execution
     */
    async execute(args) {
        const [condition, thenCode, elseCode] = args.split(';').map(s => s.trim());

        // Parse condition
        const [left, operator, right] = this.parseCondition(condition);

        // Convert to condition charm syntax
        return this.client.engine.execute(`$condition[{
            "left": "${left}",
            "operator": "${this.getOperator(operator)}",
            "right": "${right}",
            "then": "${thenCode}"${elseCode ? `,
            "else": "${elseCode}"` : ''}
        }]`);
    }

    /**
     * Parse condition string into components
     * @private
     * @param {string} condition The condition string
     * @returns {Array<string>} [left, operator, right]
     */
    parseCondition(condition) {
        const operators = ['==', '!=', '>=', '<=', '>', '<', 'includes', 'matches'];
        let operator = operators.find(op => condition.includes(op));
        
        if (!operator) {
            // Single value condition (truthy check)
            return [condition, 'equals', 'true'];
        }

        const [left, right] = condition.split(operator).map(s => s.trim());
        return [left, operator, right];
    }

    /**
     * Convert simple operators to condition charm operators
     * @private
     * @param {string} op Simple operator
     * @returns {string} Condition charm operator
     */
    getOperator(op) {
        const operatorMap = {
            '==': 'equals',
            '!=': 'notEquals',
            '>=': 'greaterOrEquals',
            '>': 'greater',
            '<=': 'lessOrEquals',
            '<': 'less',
            'includes': 'includes',
            'matches': 'matches'
        };

        return operatorMap[op] || op;
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Simple conditional execution with an easier syntax',
        usage: '$if[condition; thenCode; elseCode?]',
        arguments: [{
            name: 'condition',
            type: 'string',
            description: 'Condition to evaluate (e.g. "value == 10")'
        }, {
            name: 'thenCode',
            type: 'string',
            description: 'Code to execute if condition is true'
        }, {
            name: 'elseCode',
            type: 'string',
            optional: true,
            description: 'Code to execute if condition is false'
        }],
        examples: [
            {
                code: '$if[$$value == 10; $say[Equal]; $say[Not equal]]',
                description: 'Basic equality check'
            },
            {
                code: '$if[$$author.bot; $stop[]]',
                description: 'Stop if author is bot'
            },
            {
                code: '$if[$$data[points] >= 100; $role[add; level1]]',
                description: 'Add role if points threshold reached'
            }
        ],
        notes: [
            'Supports common comparison operators: ==, !=, >, <, >=, <=',
            'Can check for inclusion with "includes"',
            'Can use regex with "matches"',
            'Single values are checked for truthiness'
        ]
    };
}

module.exports = IfCharm;
