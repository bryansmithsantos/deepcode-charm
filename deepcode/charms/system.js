/**
 * System charm - Core system operations
 */
module.exports = {
    name: 'system',
    description: 'Core system functionality',

    async execute(args, context) {
        const { action = 'info', options = {} } = args;

        switch (action.toLowerCase()) {
            case 'info': {
                return {
                    bot: {
                        username: context.client.user.username,
                        id: context.client.user.id,
                        uptime: context.client.uptime,
                        ping: context.client.ws.ping,
                        version: process.env.npm_package_version || '1.0.0'
                    },
                    stats: {
                        guilds: context.client.guilds.cache.size,
                        users: context.client.users.cache.size,
                        channels: context.client.channels.cache.size,
                        commands: context.client.commands.items.size,
                        events: context.client.events.items.size
                    },
                    system: {
                        node: process.version,
                        platform: process.platform,
                        arch: process.arch,
                        memory: process.memoryUsage(),
                        cpu: process.cpuUsage()
                    }
                };
            }

            case 'eval': {
                const { code, async = false } = options;
                if (typeof code !== 'string') {
                    throw new Error('Code must be a string');
                }

                // Create safe context
                const ctx = {
                    client: context.client,
                    guild: context.guild,
                    channel: context.channel,
                    author: context.author,
                    message: context.message,
                    args: context.args
                };

                try {
                    let result;
                    if (async) {
                        result = await eval(`(async () => { ${code} })()`);
                    } else {
                        result = eval(code);
                    }
                    return { success: true, result };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }

            case 'exec': {
                const { command } = options;
                if (!command?.code) {
                    throw new Error('Command code required');
                }

                return await context.client.engine.process(command.code, context);
            }

            case 'cache': {
                const { action: cacheAction = 'stats', target } = options;

                switch (cacheAction) {
                    case 'stats':
                        return {
                            guilds: context.client.guilds.cache.size,
                            users: context.client.users.cache.size,
                            channels: context.client.channels.cache.size,
                            emojis: context.client.emojis.cache.size,
                            messages: context.client.channels.cache
                                .reduce((acc, c) => acc + (c.messages?.cache.size || 0), 0)
                        };

                    case 'clear':
                        switch (target) {
                            case 'guilds':
                                context.client.guilds.cache.clear();
                                break;
                            case 'users':
                                context.client.users.cache.clear();
                                break;
                            case 'channels':
                                context.client.channels.cache.clear();
                                break;
                            case 'emojis':
                                context.client.emojis.cache.clear();
                                break;
                            case 'messages':
                                context.client.channels.cache.forEach(c => c.messages?.cache.clear());
                                break;
                            case 'all':
                                context.client.guilds.cache.clear();
                                context.client.users.cache.clear();
                                context.client.channels.cache.clear();
                                context.client.emojis.cache.clear();
                                context.client.channels.cache.forEach(c => c.messages?.cache.clear());
                                break;
                            default:
                                throw new Error('Invalid cache target');
                        }
                        return true;

                    default:
                        throw new Error('Invalid cache action');
                }
            }

            case 'reload': {
                const { type, name } = options;

                switch (type) {
                    case 'command':
                        await context.client.commands.reload(name);
                        break;
                    case 'event':
                        await context.client.events.reload(name);
                        break;
                    case 'charm':
                        delete require.cache[require.resolve(`../charms/${name}.js`)];
                        const charm = require(`../charms/${name}.js`);
                        context.client.charms.set(charm.name, charm);
                        break;
                    case 'all':
                        await context.client.loader.loadAll();
                        break;
                    default:
                        throw new Error('Invalid reload type');
                }
                return true;
            }

            default:
                throw new Error('Invalid system action');
        }
    }
};
