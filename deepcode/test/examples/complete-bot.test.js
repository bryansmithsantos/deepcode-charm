/**
 * Complete Bot Tests
 * Tests comprehensive functionality of the framework
 */
const { CharmClient } = require('../../');
const { join } = require('path');
const { deleteFile, fileExists } = require('../utils');

describe('Complete Bot', () => {
    let client;
    const dataPath = join(__dirname, '../data/test-variables.json');

    beforeEach(() => {
        // Create fresh client instance
        client = new CharmClient({
            intents: ['Guilds', 'GuildMessages', 'MessageContent'],
            prefix: '!',
            debug: false,
            token: 'test-token',
            config: {
                variables: {
                    persist: true,
                    path: dataPath
                }
            }
        });
    });

    afterEach(async () => {
        // Cleanup
        if (client) {
            await client.destroy();
        }
        if (await fileExists(dataPath)) {
            await deleteFile(dataPath);
        }
    });

    describe('Client Configuration', () => {
        test('should initialize with correct options', () => {
            expect(client.prefix).toBe('!');
            expect(client.debug).toBe(false);
            expect(client.token).toBe('test-token');
        });

        test('should have required managers', () => {
            expect(client.commands).toBeDefined();
            expect(client.events).toBeDefined();
            expect(client.plugins).toBeDefined();
            expect(client.variables).toBeDefined();
        });
    });

    describe('Command System', () => {
        test('should register commands', () => {
            client.commands.register({
                name: 'test',
                code: '$say[Test]'
            });

            expect(client.commands.has('test')).toBe(true);
        });

        test('should handle command execution', async () => {
            const message = createMockMessage('!test');
            const response = await client.commands.execute(message);
            expect(response).toBe('Test');
        });

        test('should handle command errors', async () => {
            client.commands.register({
                name: 'error',
                code: '$invalidCharm[]'
            });

            const message = createMockMessage('!error');
            await expect(client.commands.execute(message))
                .rejects.toThrow();
        });
    });

    describe('Variable System', () => {
        test('should store and retrieve data', async () => {
            await client.variables.set('test', 'value');
            const result = await client.variables.get('test');
            expect(result).toBe('value');
        });

        test('should persist data', async () => {
            await client.variables.set('persist', 'test');
            await client.variables.save();

            const exists = await fileExists(dataPath);
            expect(exists).toBe(true);
        });

        test('should handle complex data', async () => {
            const data = {
                nested: {
                    array: [1, 2, 3],
                    value: 'test'
                }
            };

            await client.variables.set('complex', data);
            const result = await client.variables.get('complex');
            expect(result).toEqual(data);
        });
    });

    describe('Plugin System', () => {
        test('should load plugins', async () => {
            await client.plugins.load('test-plugin', {
                name: 'test',
                init: () => {}
            });

            expect(client.plugins.has('test-plugin')).toBe(true);
        });

        test('should handle plugin configuration', async () => {
            const config = { option: 'value' };
            
            await client.plugins.load('config-test', {
                name: 'test',
                init: function() {
                    expect(this.config).toEqual(config);
                },
                config
            });
        });

        test('should cleanup plugins properly', async () => {
            let cleaned = false;
            
            await client.plugins.load('cleanup-test', {
                name: 'test',
                init: () => {},
                destroy: () => { cleaned = true; }
            });

            await client.plugins.unload('cleanup-test');
            expect(cleaned).toBe(true);
        });
    });

    describe('Event System', () => {
        test('should handle events', () => {
            let called = false;
            
            client.events.register({
                name: 'test',
                execute: () => { called = true; }
            });

            client.emit('test');
            expect(called).toBe(true);
        });

        test('should handle event errors', () => {
            client.events.register({
                name: 'error',
                execute: () => { throw new Error('Test error'); }
            });

            expect(() => client.emit('error')).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        test('should handle complex command chain', async () => {
            client.commands.register({
                name: 'chain',
                code: '$sequence[{' +
                    '"actions": [' +
                        '$data[{' +
                            'action: "set",' +
                            'key: "test",' +
                            'value: "value"' +
                        '}],' +
                        '$condition[{' +
                            'left: "$$data[test]",' +
                            'operator: "equals",' +
                            'right: "value",' +
                            'then: "$say[Success]",' +
                            'else: "$say[Failure]"' +
                        '}]' +
                    ']' +
                '}]'
            });

            const message = createMockMessage('!chain');
            const response = await client.commands.execute(message);
            expect(response).toBe('Success');
        });

        test('should handle variable persistence in commands', async () => {
            client.commands.register({
                name: 'persist',
                code: '$sequence[{' +
                    '"actions": [' +
                        '$data[{' +
                            'action: "set",' +
                            'key: "counter",' +
                            'value: "$$data[counter] + 1"' +
                        '}],' +
                        '$say[Counter: $$data[counter]]' +
                    ']' +
                '}]'
            });

            const message = createMockMessage('!persist');
            await client.commands.execute(message);
            await client.variables.save();

            const exists = await fileExists(dataPath);
            expect(exists).toBe(true);
        });
    });
});

// Helper functions
function createMockMessage(content) {
    return {
        content,
        author: {
            id: 'test-user',
            bot: false
        },
        channel: {
            send: jest.fn()
        }
    };
}
