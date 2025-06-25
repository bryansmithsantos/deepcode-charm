/**
 * Validate Charm - Complex input validation
 * @module charms/validate
 */
const BaseCharm = require('./BaseCharm');

class ValidateCharm extends BaseCharm {
    constructor(client) {
        super(client);
        this.name = 'validate';
        this.description = 'Validate input data against rules';
        this.tier = 2;
        this.examples = [
            '$validate[{"value": "$$input", "type": "string", "minLength": 3}]',
            '$validate[{"value": "$$points", "type": "number", "min": 0, "max": 100}]'
        ];
    }

    /**
     * Execute the validate charm
     * @param {Object} args Validation rules
     * @param {any} args.value Value to validate
     * @param {string} args.type Expected type
     * @param {Object} [args.rules] Additional validation rules
     * @throws {Error} Validation error if rules fail
     */
    async execute(args) {
        const { value, type, ...rules } = args;

        if (!value || !type) {
            throw new Error('Validate charm requires value and type');
        }

        // Type validation
        if (!this.validateType(value, type)) {
            throw new Error(`Invalid type: expected ${type}`);
        }

        // Apply type-specific validations
        switch (type.toLowerCase()) {
            case 'string':
                await this.validateString(value, rules);
                break;
            case 'number':
                await this.validateNumber(value, rules);
                break;
            case 'array':
                await this.validateArray(value, rules);
                break;
            case 'object':
                await this.validateObject(value, rules);
                break;
        }

        // Custom validation function if provided
        if (rules.validate) {
            const result = await this.client.engine.execute(`${rules.validate}`);
            if (!result) {
                throw new Error(rules.message || 'Custom validation failed');
            }
        }

        return true;
    }

    /**
     * Validate value type
     * @private
     */
    validateType(value, type) {
        switch (type.toLowerCase()) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' || !isNaN(Number(value));
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && !Array.isArray(value);
            default:
                return typeof value === type;
        }
    }

    /**
     * Validate string rules
     * @private
     */
    async validateString(value, rules) {
        const str = String(value);

        if (rules.minLength && str.length < rules.minLength) {
            throw new Error(`String too short (min: ${rules.minLength})`);
        }
        if (rules.maxLength && str.length > rules.maxLength) {
            throw new Error(`String too long (max: ${rules.maxLength})`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(str)) {
            throw new Error(rules.patternMessage || 'String does not match pattern');
        }
        if (rules.enum && !rules.enum.includes(str)) {
            throw new Error(`Value must be one of: ${rules.enum.join(', ')}`);
        }
    }

    /**
     * Validate number rules
     * @private
     */
    async validateNumber(value, rules) {
        const num = Number(value);

        if (rules.min && num < rules.min) {
            throw new Error(`Number too small (min: ${rules.min})`);
        }
        if (rules.max && num > rules.max) {
            throw new Error(`Number too large (max: ${rules.max})`);
        }
        if (rules.integer && !Number.isInteger(num)) {
            throw new Error('Number must be integer');
        }
        if (rules.positive && num <= 0) {
            throw new Error('Number must be positive');
        }
        if (rules.negative && num >= 0) {
            throw new Error('Number must be negative');
        }
    }

    /**
     * Validate array rules
     * @private
     */
    async validateArray(value, rules) {
        if (rules.minItems && value.length < rules.minItems) {
            throw new Error(`Array too short (min: ${rules.minItems})`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
            throw new Error(`Array too long (max: ${rules.maxItems})`);
        }
        if (rules.itemType) {
            for (const item of value) {
                await this.execute({
                    value: item,
                    type: rules.itemType,
                    ...rules.itemRules
                });
            }
        }
    }

    /**
     * Validate object rules
     * @private
     */
    async validateObject(value, rules) {
        if (rules.required && rules.required.length > 0) {
            for (const field of rules.required) {
                if (!(field in value)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
        }
        if (rules.properties) {
            for (const [key, fieldRules] of Object.entries(rules.properties)) {
                if (key in value) {
                    await this.execute({
                        value: value[key],
                        ...fieldRules
                    });
                }
            }
        }
    }

    /**
     * Get documentation for this charm
     * @returns {Object} Charm documentation
     */
    static documentation = {
        description: 'Validate input data against complex rules',
        usage: '$validate[{"value": value, "type": type, ...rules}]',
        arguments: [{
            name: 'value',
            type: 'any',
            description: 'Value to validate'
        }, {
            name: 'type',
            type: 'string',
            description: 'Expected type (string, number, array, object)'
        }, {
            name: 'rules',
            type: 'object',
            optional: true,
            description: 'Type-specific validation rules'
        }],
        examples: [
            {
                code: '$validate[{"value": "$$username", "type": "string", "minLength": 3, "maxLength": 20, "pattern": "^[a-zA-Z0-9_]+$"}]',
                description: 'Username validation'
            },
            {
                code: '$validate[{"value": "$$points", "type": "number", "min": 0, "max": 100, "integer": true}]',
                description: 'Score validation'
            },
            {
                code: '$validate[{"value": "$$roles", "type": "array", "minItems": 1, "itemType": "string"}]',
                description: 'Role list validation'
            },
            {
                code: `$validate[{
                    "value": "$$user",
                    "type": "object",
                    "required": ["id", "name"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string", "minLength": 1},
                        "age": {"type": "number", "min": 13}
                    }
                }]`,
                description: 'User object validation'
            }
        ],
        notes: [
            'Supports multiple data types',
            'Type-specific validation rules',
            'Nested object validation',
            'Array item validation',
            'Custom validation functions',
            'Clear error messages'
        ]
    };

    /**
     * Portuguese documentation
     */
    static ptDocs = {
        description: 'Valida dados de entrada contra regras complexas',
        usage: '$validate[{"value": valor, "type": tipo, ...regras}]',
        arguments: [{
            name: 'value',
            type: 'any',
            description: 'Valor para validar'
        }, {
            name: 'type',
            type: 'string',
            description: 'Tipo esperado (string, number, array, object)'
        }, {
            name: 'rules',
            type: 'object',
            optional: true,
            description: 'Regras de validação específicas do tipo'
        }],
        examples: [
            {
                code: '$validate[{"value": "$$username", "type": "string", "minLength": 3, "maxLength": 20, "pattern": "^[a-zA-Z0-9_]+$"}]',
                description: 'Validação de nome de usuário'
            },
            {
                code: '$validate[{"value": "$$pontos", "type": "number", "min": 0, "max": 100, "integer": true}]',
                description: 'Validação de pontuação'
            },
            {
                code: '$validate[{"value": "$$roles", "type": "array", "minItems": 1, "itemType": "string"}]',
                description: 'Validação de lista de cargos'
            },
            {
                code: `$validate[{
                    "value": "$$user",
                    "type": "object",
                    "required": ["id", "name"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string", "minLength": 1},
                        "age": {"type": "number", "min": 13}
                    }
                }]`,
                description: 'Validação de objeto de usuário'
            }
        ],
        notes: [
            'Suporta múltiplos tipos de dados',
            'Regras de validação específicas por tipo',
            'Validação de objetos aninhados',
            'Validação de itens de array',
            'Funções de validação customizadas',
            'Mensagens de erro claras'
        ]
    };
}

module.exports = ValidateCharm;
