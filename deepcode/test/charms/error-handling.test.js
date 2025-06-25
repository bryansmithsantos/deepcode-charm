const { CharmClient } = require('../../core/client');
const { expect } = require('jest');

describe('Error Handling Charms', () => {
    let client;

    beforeEach(() => {
        client = new CharmClient({
            intents: ['Guilds', 'GuildMessages']
        });
    });

    describe('Throw Charm', () => {
        test('throws string error message', async () => {
            await expect(client.engine.execute(`
                $throw[Test error]
            `)).rejects.toThrow('Test error');
        });

        test('throws error object with custom properties', async () => {
            try {
                await client.engine.execute(`
                    $throw[{
                        "message": "Invalid role",
                        "code": "E001",
                        "role": "admin"
                    }]
                `);
            } catch (error) {
                expect(error.message).toBe('Invalid role');
                expect(error.code).toBe('E001');
                expect(error.role).toBe('admin');
            }
        });

        test('throws default error for invalid input', async () => {
            await expect(client.engine.execute(`
                $throw[null]
            `)).rejects.toThrow('Throw charm requires message or error object');
        });
    });

    describe('Try-Catch Integration', () => {
        test('catches thrown error', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$throw[Test error]",
                    "catch": "$say[Caught: $$error]"
                }]
            `);
            expect(result).toContain('Caught: Test error');
        });

        test('provides error properties in catch block', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$throw[{message: 'Error', code: 'E001'}]",
                    "catch": "$sequence[{
                        actions: [
                            '$say[Error: $$error]',
                            '$say[Code: $$error.code]'
                        ]
                    }]"
                }]
            `);
            expect(result[0]).toContain('Error');
            expect(result[1]).toContain('E001');
        });

        test('executes finally block after throw', async () => {
            let finallyExecuted = false;
            await client.engine.execute(`
                $try[{
                    "code": "$throw[Test error]",
                    "catch": "$say[Caught]",
                    "finally": "${finallyExecuted = true}"
                }]
            `);
            expect(finallyExecuted).toBe(true);
        });
    });

    describe('Complex Error Scenarios', () => {
        test('handles nested try-catch blocks', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$try[{
                        code: '$throw[Inner error]',
                        catch: '$throw[Outer error]'
                    }]",
                    "catch": "$say[Final: $$error]"
                }]
            `);
            expect(result).toContain('Final: Outer error');
        });

        test('handles errors in loops', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$loop[{
                        times: 3,
                        code: $sequence[{
                            actions: [
                                '$if[$$index == 1; $throw[Loop error]]',
                                '$say[Index: $$index]'
                            ]
                        }]
                    }]",
                    "catch": "$say[Error at index: $$error]"
                }]
            `);
            expect(result).toContain('Error at index: Loop error');
        });

        test('handles async error scenarios', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$sequence[{
                        actions: [
                            '$data[set; shouldError; true]',
                            '$wait[100ms]',
                            '$if[$$data[get; shouldError]; $throw[Async error]]'
                        ]
                    }]",
                    "catch": "$say[Caught async: $$error]"
                }]
            `);
            expect(result).toContain('Caught async: Async error');
        });
    });

    describe('Error Context Handling', () => {
        test('preserves error stack trace', async () => {
            try {
                await client.engine.execute(`
                    $throw[{"message": "Test", "stack": "Custom stack"}]
                `);
            } catch (error) {
                expect(error.stack).toBeDefined();
            }
        });

        test('provides error type information', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$throw[{message: 'Test', type: 'ValidationError'}]",
                    "catch": "$say[Type: $$error.type]"
                }]
            `);
            expect(result).toContain('Type: ValidationError');
        });

        test('includes original code in error context', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$throw[Test]",
                    "catch": "$say[Code: $$error.code]"
                }]
            `);
            expect(result).toBeDefined();
        });
    });

    describe('Error Recovery', () => {
        test('can continue after caught error', async () => {
            const results = await client.engine.execute(`
                $sequence[{
                    actions: [
                        '$try[{
                            code: "$throw[Error 1]",
                            catch: "$say[Caught 1]"
                        }]',
                        '$say[Continuing]',
                        '$try[{
                            code: "$throw[Error 2]",
                            catch: "$say[Caught 2]"
                        }]'
                    ]
                }]
            `);
            expect(results).toContain('Caught 1');
            expect(results).toContain('Continuing');
            expect(results).toContain('Caught 2');
        });

        test('can reset error state', async () => {
            const result = await client.engine.execute(`
                $sequence[{
                    actions: [
                        '$try[{
                            code: "$throw[Test]",
                            catch: "$data[set; error; null]"
                        }]',
                        '$if[$$data[get; error]; $say[Error exists]; $say[No error]]'
                    ]
                }]
            `);
            expect(result).toContain('No error');
        });
    });
});
