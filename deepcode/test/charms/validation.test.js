const { CharmClient } = require('../../core/client');
const { expect } = require('jest');

describe('Validation Charms', () => {
    let client;

    beforeEach(() => {
        client = new CharmClient({
            intents: ['Guilds', 'GuildMessages']
        });
    });

    describe('Validate Charm', () => {
        describe('Type Validation', () => {
            test('validates string type', async () => {
                const result = await client.engine.execute(`
                    $validate[{"value": "test", "type": "string"}]
                `);
                expect(result).toBe(true);
            });

            test('validates number type', async () => {
                const result = await client.engine.execute(`
                    $validate[{"value": 123, "type": "number"}]
                `);
                expect(result).toBe(true);
            });

            test('validates array type', async () => {
                const result = await client.engine.execute(`
                    $validate[{"value": [1, 2, 3], "type": "array"}]
                `);
                expect(result).toBe(true);
            });

            test('validates object type', async () => {
                const result = await client.engine.execute(`
                    $validate[{"value": {"test": true}, "type": "object"}]
                `);
                expect(result).toBe(true);
            });

            test('fails on wrong type', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": 123, "type": "string"}]
                `)).rejects.toThrow('Invalid type');
            });
        });

        describe('String Validation', () => {
            test('validates minLength', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": "ab", "type": "string", "minLength": 3}]
                `)).rejects.toThrow('String too short');
            });

            test('validates maxLength', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": "abcd", "type": "string", "maxLength": 3}]
                `)).rejects.toThrow('String too long');
            });

            test('validates pattern', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": "test123", "type": "string", "pattern": "^[a-z]+$"}]
                `)).rejects.toThrow('does not match pattern');
            });

            test('validates enum', async () => {
                const result = await client.engine.execute(`
                    $validate[{"value": "admin", "type": "string", "enum": ["user", "admin", "mod"]}]
                `);
                expect(result).toBe(true);
            });
        });

        describe('Number Validation', () => {
            test('validates min value', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": 5, "type": "number", "min": 10}]
                `)).rejects.toThrow('Number too small');
            });

            test('validates max value', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": 15, "type": "number", "max": 10}]
                `)).rejects.toThrow('Number too large');
            });

            test('validates integer', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": 1.5, "type": "number", "integer": true}]
                `)).rejects.toThrow('must be integer');
            });

            test('validates positive', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": -1, "type": "number", "positive": true}]
                `)).rejects.toThrow('must be positive');
            });
        });

        describe('Array Validation', () => {
            test('validates minItems', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": [], "type": "array", "minItems": 1}]
                `)).rejects.toThrow('Array too short');
            });

            test('validates maxItems', async () => {
                await expect(client.engine.execute(`
                    $validate[{"value": [1, 2, 3], "type": "array", "maxItems": 2}]
                `)).rejects.toThrow('Array too long');
            });

            test('validates item types', async () => {
                const result = await client.engine.execute(`
                    $validate[{
                        "value": ["a", "b", "c"],
                        "type": "array",
                        "itemType": "string"
                    }]
                `);
                expect(result).toBe(true);
            });
        });

        describe('Object Validation', () => {
            test('validates required fields', async () => {
                await expect(client.engine.execute(`
                    $validate[{
                        "value": {"name": "test"},
                        "type": "object",
                        "required": ["name", "id"]
                    }]
                `)).rejects.toThrow('Missing required field');
            });

            test('validates nested properties', async () => {
                const result = await client.engine.execute(`
                    $validate[{
                        "value": {
                            "user": {
                                "name": "test",
                                "age": 25
                            }
                        },
                        "type": "object",
                        "properties": {
                            "user": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "age": {"type": "number", "min": 13}
                                }
                            }
                        }
                    }]
                `);
                expect(result).toBe(true);
            });
        });

        describe('Custom Validation', () => {
            test('supports custom validation functions', async () => {
                const result = await client.engine.execute(`
                    $validate[{
                        "value": "test",
                        "type": "string",
                        "validate": "$equal[$$value; test]"
                    }]
                `);
                expect(result).toBe(true);
            });

            test('supports custom error messages', async () => {
                await expect(client.engine.execute(`
                    $validate[{
                        "value": "test",
                        "type": "string",
                        "validate": "$equal[$$value; other]",
                        "message": "Custom error"
                    }]
                `)).rejects.toThrow('Custom error');
            });
        });

        describe('Integration Tests', () => {
            test('works with try/catch', async () => {
                const result = await client.engine.execute(`
                    $try[{
                        "code": "$validate[{value: test, type: number}]",
                        "catch": "$say[Invalid: $$error]"
                    }]
                `);
                expect(result).toContain('Invalid');
            });

            test('works in loops', async () => {
                const result = await client.engine.execute(`
                    $foreach[[1, "2", 3]; $try[{
                        code: "$validate[{value: $$value, type: number}]",
                        catch: "$say[Invalid item: $$value]"
                    }]]
                `);
                expect(result.some(r => r && r.includes('Invalid'))).toBe(false);
            });

            test('validates complex data structures', async () => {
                const result = await client.engine.execute(`
                    $validate[{
                        "value": {
                            "users": [
                                {"name": "test1", "age": 20},
                                {"name": "test2", "age": 25}
                            ],
                            "settings": {
                                "enabled": true,
                                "maxUsers": 10
                            }
                        },
                        "type": "object",
                        "properties": {
                            "users": {
                                "type": "array",
                                "itemType": "object",
                                "itemRules": {
                                    "properties": {
                                        "name": {"type": "string"},
                                        "age": {"type": "number", "min": 13}
                                    }
                                }
                            },
                            "settings": {
                                "type": "object",
                                "properties": {
                                    "enabled": {"type": "boolean"},
                                    "maxUsers": {"type": "number", "positive": true}
                                }
                            }
                        }
                    }]
                `);
                expect(result).toBe(true);
            });
        });
    });
});
