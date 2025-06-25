/**
 * Schema Utilities - Helper functions for schema validation
 * @module utils/schema-utils
 */

const schemas = require('./schemas');

class SchemaUtils {
    /**
     * Create a schema reference
     * @param {string} schemaName Name of existing schema
     * @returns {Object} Schema reference
     */
    static ref(schemaName) {
        return { $ref: schemaName };
    }

    /**
     * Merge multiple schemas
     * @param {...Object} schemas Schemas to merge
     * @returns {Object} Merged schema
     */
    static merge(...schemas) {
        return schemas.reduce((merged, schema) => {
            if (!schema || typeof schema !== 'object') return merged;
            
            return {
                ...merged,
                properties: {
                    ...(merged.properties || {}),
                    ...(schema.properties || {})
                },
                required: [
                    ...(merged.required || []),
                    ...(schema.required || [])
                ]
            };
        }, {});
    }

    /**
     * Create a partial schema (all fields optional)
     * @param {Object} schema Original schema
     * @returns {Object} Partial schema
     */
    static partial(schema) {
        if (!schema || typeof schema !== 'object') return schema;

        return {
            ...schema,
            required: [],
            properties: Object.entries(schema.properties || {}).reduce((props, [key, value]) => ({
                ...props,
                [key]: typeof value === 'object' ? this.partial(value) : value
            }), {})
        };
    }

    /**
     * Create a pick schema (only selected fields)
     * @param {Object} schema Original schema
     * @param {string[]} fields Fields to pick
     * @returns {Object} Picked schema
     */
    static pick(schema, fields) {
        if (!schema || !Array.isArray(fields)) return schema;

        return {
            ...schema,
            properties: fields.reduce((props, field) => ({
                ...props,
                [field]: schema.properties?.[field]
            }), {}),
            required: schema.required?.filter(field => fields.includes(field)) || []
        };
    }

    /**
     * Create an omit schema (exclude fields)
     * @param {Object} schema Original schema
     * @param {string[]} fields Fields to omit
     * @returns {Object} Schema without omitted fields
     */
    static omit(schema, fields) {
        if (!schema || !Array.isArray(fields)) return schema;

        const remaining = Object.keys(schema.properties || {})
            .filter(key => !fields.includes(key));

        return this.pick(schema, remaining);
    }

    /**
     * Create an array schema
     * @param {Object} itemSchema Schema for array items
     * @param {Object} [options] Array options
     * @returns {Object} Array schema
     */
    static array(itemSchema, options = {}) {
        return {
            type: 'array',
            itemType: itemSchema.type,
            itemRules: itemSchema,
            ...options
        };
    }

    /**
     * Create a nullable schema
     * @param {Object} schema Original schema
     * @returns {Object} Nullable schema
     */
    static nullable(schema) {
        return {
            ...schema,
            nullable: true
        };
    }

    /**
     * Create a readonly schema
     * @param {Object} schema Original schema
     * @returns {Object} Readonly schema
     */
    static readonly(schema) {
        return {
            ...schema,
            readonly: true
        };
    }

    /**
     * Create an enum schema
     * @param {Array} values Enum values
     * @returns {Object} Enum schema
     */
    static enum(values) {
        return {
            type: Array.isArray(values) && values.every(v => typeof v === 'number') ? 'number' : 'string',
            enum: values
        };
    }

    /**
     * Create a union schema
     * @param {...Object} schemas Possible schemas
     * @returns {Object} Union schema
     */
    static union(...schemas) {
        return {
            type: 'union',
            schemas
        };
    }

    /**
     * Create a conditional schema
     * @param {Object} condition Condition object
     * @param {Object} thenSchema Schema if condition is true
     * @param {Object} elseSchema Schema if condition is false
     * @returns {Object} Conditional schema
     */
    static when(condition, thenSchema, elseSchema) {
        return {
            type: 'conditional',
            condition,
            then: thenSchema,
            else: elseSchema
        };
    }

    /**
     * Add validations to a schema
     * @param {Object} schema Original schema
     * @param {Object} validations Custom validations
     * @returns {Object} Schema with validations
     */
    static validate(schema, validations) {
        return {
            ...schema,
            validate: validations
        };
    }

    /**
     * Create a schema builder
     * @returns {SchemaBuilder} Schema builder instance
     */
    static builder() {
        return new SchemaBuilder();
    }
}

/**
 * Schema Builder - Fluent API for schema creation
 */
class SchemaBuilder {
    constructor() {
        this.schema = { type: 'object', properties: {} };
    }

    /**
     * Add a string field
     * @param {string} name Field name
     * @param {Object} [rules] Validation rules
     */
    string(name, rules = {}) {
        this.schema.properties[name] = { type: 'string', ...rules };
        return this;
    }

    /**
     * Add a number field
     * @param {string} name Field name
     * @param {Object} [rules] Validation rules
     */
    number(name, rules = {}) {
        this.schema.properties[name] = { type: 'number', ...rules };
        return this;
    }

    /**
     * Add a boolean field
     * @param {string} name Field name
     */
    boolean(name) {
        this.schema.properties[name] = { type: 'boolean' };
        return this;
    }

    /**
     * Add an array field
     * @param {string} name Field name
     * @param {Object} itemSchema Schema for items
     * @param {Object} [rules] Array rules
     */
    array(name, itemSchema, rules = {}) {
        this.schema.properties[name] = SchemaUtils.array(itemSchema, rules);
        return this;
    }

    /**
     * Add an object field
     * @param {string} name Field name
     * @param {Object} properties Object properties
     */
    object(name, properties) {
        this.schema.properties[name] = { type: 'object', properties };
        return this;
    }

    /**
     * Add an enum field
     * @param {string} name Field name
     * @param {Array} values Enum values
     */
    enum(name, values) {
        this.schema.properties[name] = SchemaUtils.enum(values);
        return this;
    }

    /**
     * Mark fields as required
     * @param {...string} fields Required field names
     */
    required(...fields) {
        this.schema.required = [...(this.schema.required || []), ...fields];
        return this;
    }

    /**
     * Build the final schema
     * @returns {Object} Complete schema
     */
    build() {
        return this.schema;
    }
}

module.exports = SchemaUtils;

// Examples:
/*
const userSchema = SchemaUtils.builder()
    .string('username', { minLength: 3, maxLength: 32 })
    .string('email', { pattern: schemas.patterns.email })
    .number('age', { min: 13, max: 120 })
    .boolean('active')
    .array('roles', { type: 'string' }, { minItems: 1 })
    .object('settings', {
        theme: SchemaUtils.enum(['light', 'dark']),
        notifications: { type: 'boolean' }
    })
    .required('username', 'email')
    .build();

const partialUser = SchemaUtils.partial(userSchema);
const profileOnly = SchemaUtils.pick(userSchema, ['username', 'email']);
const noSettings = SchemaUtils.omit(userSchema, ['settings']);
*/
