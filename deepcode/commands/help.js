/**
 * Help command - Shows commands and charm documentation
 */
module.exports = {
    name: 'help',
    description: 'Show command help and charm documentation',
    usage: '[command/charm]',
    aliases: ['h', 'commands', 'charms'],
    cooldown: 5,

    code: '$condition[{' +
        '"left": "$$args[0]",' +
        '"operator": "exists",' +
        '"then": "$system[{' +
            '"action": "exec",' +
            '"command": {' +
                '"code": "$$showDetailedHelp"' +
            '}' +
        '}]",' +
        '"else": "$embed[{' +
            '"title": "Command Help",' +
            '"description": "Available commands and charms grouped by tier\\n\\nUse `$$prefix help <name>` for details",' +
            '"fields": [' +
                // Tier 1 - Basic
                '{' +
                    '"name": "🔹 Tier 1 - Basic",' +
                    '"value": "`$say` Send messages\\n" + ' +
                    '"`$data` Variable operations\\n" + ' +
                    '"`$condition` Logic control\\n" + ' +
                    '"`$array` Array operations\\n" + ' +
                    '"`$string` Text manipulation"' +
                '},' +
                // Tier 2 - Intermediate
                '{' +
                    '"name": "🔸 Tier 2 - Intermediate",' +
                    '"value": "`$message` Message control\\n" + ' +
                    '"`$channel` Channel operations\\n" + ' +
                    '"`$member` Member management\\n" + ' +
                    '"`$component` Interactive elements\\n" + ' +
                    '"`$embed` Rich embeds"' +
                '},' +
                // Tier 3 - Advanced
                '{' +
                    '"name": "💠 Tier 3 - Advanced",' +
                    '"value": "`$permission` Permission control\\n" + ' +
                    '"`$role` Role management\\n" + ' +
                    '"`$voice` Voice operations\\n" + ' +
                    '"`$system` System functions\\n" + ' +
                    '"`$timer` Scheduling"' +
                '},' +
                // Commands
                '{' +
                    '"name": "📚 Commands",' +
                    '"value": "$$commands.list"' +
                '}' +
            '],' +
            '"color": "BLUE",' +
            '"footer": {' +
                '"text": "Use $$prefix help <command/charm> for details"' +
            '}' +
        '}]"' +
    '}]',

    // Variables
    variables: {
        'commands.list': function(context) {
            return Array.from(context.client.commands.values())
                .map(cmd => `\`${context.client.prefix}${cmd.name}\` ${cmd.description || ''}`)
                .join('\n');
        },
        'showDetailedHelp': function(context) {
            const query = context.args[0].toLowerCase();
            const command = context.client.commands.get(query);
            const charm = context.client.charms.get(query);

            if (command) {
                return '$embed[{' +
                    '"title": "Command: ' + command.name + '",' +
                    '"fields": [' +
                        '{"name": "Description", "value": "' + (command.description || 'No description') + '"},' +
                        '{"name": "Usage", "value": "`' + context.client.prefix + command.name + ' ' + (command.usage || '') + '`"},' +
                        '{"name": "Aliases", "value": "' + (command.aliases?.join(', ') || 'None') + '", "inline": true},' +
                        '{"name": "Cooldown", "value": "' + (command.cooldown || 0) + 's", "inline": true},' +
                        '{"name": "Permissions", "value": "' + (command.permissions?.join(', ') || 'None') + '", "inline": true}' +
                    '],' +
                    '"color": "GREEN"' +
                '}]';
            }

            if (charm) {
                return '$embed[{' +
                    '"title": "Charm: $' + charm.name + '",' +
                    '"fields": [' +
                        '{"name": "Description", "value": "' + (charm.description || 'No description') + '"},' +
                        '{"name": "Usage", "value": "`$' + charm.name + '[options]`"},' +
                        '{"name": "Examples", "value": "' + this.getCharmExamples(charm.name) + '"}' +
                    '],' +
                    '"color": "BLUE"' +
                '}]';
            }

            return '$say[No command or charm found with that name]';
        }
    },

    // Helper methods
    getCharmExamples(charmName) {
        const examples = {
            'say': '`$say[Hello World!]`\n`$say[{"content": "Hello", "tts": true}]`',
            'data': '`$data[{"action": "set", "key": "points", "value": 100}]`',
            'condition': '`$condition[{"left": "value", "operator": "equals", "right": 5}]`',
            'array': '`$array[{"action": "push", "array": "items", "value": "item"}]`',
            'string': '`$string[{"action": "case", "text": "hello", "type": "upper"}]`',
            'message': '`$message[{"action": "edit", "content": "New content"}]`',
            'channel': '`$channel[{"action": "create", "name": "channel"}]`',
            'member': '`$member[{"action": "nickname", "target": "user", "nickname": "New"}]`',
            'component': '`$component[{"action": "create", "type": "button"}]`',
            'embed': '`$embed[{"title": "Title", "description": "Content"}]`',
            'permission': '`$permission[{"action": "check", "permissions": ["SEND_MESSAGES"]}]`',
            'role': '`$role[{"action": "create", "name": "Role"}]`',
            'voice': '`$voice[{"action": "move", "channel": "channel-id"}]`',
            'system': '`$system[{"action": "eval", "code": "code"}]`',
            'timer': '`$timer[{"action": "schedule", "time": "5m"}]`'
        };

        return examples[charmName] || 'No examples available';
    }
};
