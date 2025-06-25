/**
 * Message event handler
 */
module.exports = {
    name: 'messageCreate',
    description: 'Handle message creation',

    /**
     * Execute the event
     */
    async execute(message, client) {
        try {
            // Ignore bot messages
            if (message.author.bot) return;

            // Get prefix
            const prefix = client.prefix;

            // Check for prefix
            if (!message.content.startsWith(prefix)) return;

            // Get command name and args
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();

            if (!commandName) return;

            // Get command
            const command = client.commands.get(commandName);
            if (!command) return;

            // Execute command code
            if (command.code) {
                await client.engine.process(command.code, {
                    message,
                    command,
                    args,
                    client,
                    send: (payload) => message.reply(payload)
                });
            }
            // Or execute command function
            else if (command.execute) {
                await command.execute(message, args, client);
            }

        } catch (error) {
            console.error('Message event error:', error);
            
            // Try to notify user
            await message.reply({ 
                content: '❌ An error occurred while executing the command.',
                ephemeral: true
            }).catch(() => {});
        }
    }
};
