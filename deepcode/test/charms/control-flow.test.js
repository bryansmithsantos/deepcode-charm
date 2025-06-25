const { CharmClient } = require('../../core/client');
const { expect } = require('jest');

describe('Control Flow Charms', () => {
    let client;

    beforeEach(() => {
        client = new CharmClient({
            intents: ['Guilds', 'GuildMessages']
        });
    });

    describe('If Charm', () => {
        test('executes then code when condition is true', async () => {
            const result = await client.engine.execute('$if[true; $say[True]]');
            expect(result).toBe(true);
        });

        test('does not execute then code when condition is false', async () => {
            const result = await client.engine.execute('$if[false; $say[False]]');
            expect(result).toBe(false);
        });

        test('supports complex conditions', async () => {
            const result = await client.engine.execute('$if[$$value > 10 && $$value < 20; $say[Between]]');
            expect(result).toBe(false);
        });
    });

    describe('Else Charm', () => {
        test('executes when previous if was false', async () => {
            const result = await client.engine.execute('$if[false; $say[If]]; $else[$say[Else]]');
            expect(result).toBe(true);
        });

        test('does not execute when previous if was true', async () => {
            const result = await client.engine.execute('$if[true; $say[If]]; $else[$say[Else]]');
            expect(result).toBe(true);
        });
    });

    describe('ElseIf Charm', () => {
        test('executes when previous conditions were false and its condition is true', async () => {
            const result = await client.engine.execute('$if[false; $say[If]]; $elseif[true; $say[ElseIf]]; $else[$say[Else]]');
            expect(result).toBe(true);
        });

        test('supports multiple elseif blocks', async () => {
            const result = await client.engine.execute(`
                $if[false; $say[If]];
                $elseif[false; $say[ElseIf1]];
                $elseif[true; $say[ElseIf2]];
                $else[$say[Else]]
            `);
            expect(result).toBe(true);
        });
    });

    describe('Switch Charm', () => {
        test('executes matching case', async () => {
            const result = await client.engine.execute(`
                $switch[{
                    "value": "test",
                    "cases": {
                        "test": "$say[Test]",
                        "other": "$say[Other]"
                    }
                }]
            `);
            expect(result).toBeTruthy();
        });

        test('executes default case when no match', async () => {
            const result = await client.engine.execute(`
                $switch[{
                    "value": "unknown",
                    "cases": {
                        "test": "$say[Test]",
                        "default": "$say[Default]"
                    }
                }]
            `);
            expect(result).toBeTruthy();
        });
    });

    describe('Loop Charm', () => {
        test('executes code specified number of times', async () => {
            const result = await client.engine.execute(`
                $loop[{
                    "times": 3,
                    "code": "$say[$$index]"
                }]
            `);
            expect(result.length).toBe(3);
        });

        test('iterates over array', async () => {
            const result = await client.engine.execute(`
                $loop[{
                    "array": ["a", "b", "c"],
                    "code": "$say[$$value]"
                }]
            `);
            expect(result.length).toBe(3);
        });

        test('supports async execution', async () => {
            const result = await client.engine.execute(`
                $loop[{
                    "array": ["a", "b", "c"],
                    "code": "$say[$$value]",
                    "async": true
                }]
            `);
            expect(result.length).toBe(3);
        });
    });

    describe('While Charm', () => {
        test('executes while condition is true', async () => {
            const result = await client.engine.execute(`
                $data[set; count; 0];
                $while[{
                    "condition": "$$data[get; count] < 3",
                    "code": "$data[add; count; 1]"
                }]
            `);
            expect(result.length).toBe(3);
        });

        test('respects timeout', async () => {
            await expect(client.engine.execute(`
                $while[{
                    "condition": "true",
                    "code": "$wait[1s]",
                    "timeout": 2
                }]
            `)).rejects.toThrow();
        });
    });

    describe('ForEach Charm', () => {
        test('iterates over array elements', async () => {
            const result = await client.engine.execute(`
                $foreach[["a", "b", "c"]; $say[$$value]]
            `);
            expect(result.length).toBe(3);
        });

        test('provides index and value', async () => {
            const result = await client.engine.execute(`
                $foreach[["a", "b"]; $say[$$index: $$value]]
            `);
            expect(result.length).toBe(2);
        });
    });

    describe('Break Charm', () => {
        test('exits loop', async () => {
            const result = await client.engine.execute(`
                $loop[{
                    "times": 5,
                    "code": "$if[$$index == 2; $break[]]; $say[$$index]"
                }]
            `);
            expect(result.length).toBe(2);
        });

        test('supports reason', async () => {
            const result = await client.engine.execute(`
                $loop[{
                    "times": 5,
                    "code": "$if[$$index == 2; $break[Test]]; $say[$$index]"
                }]
            `);
            expect(result.length).toBe(2);
        });
    });

    describe('Continue Charm', () => {
        test('skips iteration', async () => {
            const result = await client.engine.execute(`
                $loop[{
                    "times": 3,
                    "code": "$if[$$index == 1; $continue[]]; $say[$$index]"
                }]
            `);
            expect(result.filter(Boolean).length).toBe(2);
        });
    });

    describe('Try Charm', () => {
        test('executes catch on error', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$data[get; missing]",
                    "catch": "$say[Error: $$error]"
                }]
            `);
            expect(result).toBeTruthy();
        });

        test('executes finally block', async () => {
            let finallyExecuted = false;
            const result = await client.engine.execute(`
                $try[{
                    "code": "$say[Try]",
                    "finally": "${finallyExecuted = true}"
                }]
            `);
            expect(finallyExecuted).toBe(true);
        });
    });

    describe('Complex Control Flow', () => {
        test('combines multiple control structures', async () => {
            const result = await client.engine.execute(`
                $try[{
                    "code": "$loop[{
                        times: 5,
                        code: $sequence[{
                            actions: [
                                "$if[$$index == 2; $continue[]]",
                                "$if[$$index == 4; $break[]]",
                                "$say[Index: $$index]"
                            ]
                        }]
                    }]",
                    "catch": "$say[Error: $$error]",
                    "finally": "$say[Done]"
                }]
            `);
            expect(result).toBeTruthy();
        });
    });
});
