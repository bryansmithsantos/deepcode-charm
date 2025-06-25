/**
 * Welcome command - Demonstrates charm usage and features
 */
module.exports = {
    name: 'welcome',
    description: 'Welcome message with role assignment',
    usage: '<@user> [role]',
    tier: 2,
    cooldown: 5,
    permissions: ['MANAGE_ROLES'],

    // Command code using multiple charms
    code: 
        // Check permissions first
        '$condition[{' +
            '"left": "$$member.permissions",' +
            '"operator": "includes",' +
            '"right": "MANAGE_ROLES",' +
            '"then": "$sequence[{' +
                '"actions": [' +
                    // Get or create welcome role
                    '$data[{' +
                        '"action": "get",' +
                        '"key": "welcomeRole",' +
                        '"default": "$role[{' +
                            '"action": "create",' +
                            '"options": {' +
                                '"name": "Welcomed",' +
                                '"color": "BLUE",' +
                                '"reason": "Welcome system role"' +
                            '"}' +
                        '}]"' +
                    '}],' +

                    // Add role to mentioned user
                    '$condition[{' +
                        '"left": "$$mentions",' +
                        '"operator": "exists",' +
                        '"then": "$role[{' +
                            '"action": "add",' +
                            '"target": "$$mentions[0]",' +
                            '"roleId": "$$data[welcomeRole]",' +
                            '"reason": "Welcome command"' +
                        '}]",' +
                        '"else": "$say[Please mention a user to welcome]"' +
                    '}],' +

                    // Create welcome embed
                    '$embed[{' +
                        '"title": "Welcome!",' +
                        '"description": "Welcome $$mentions[0] to the server!",' +
                        '"color": "BLUE",' +
                        '"thumbnail": {"url": "$$mentions[0].avatarURL"},' +
                        '"fields": [' +
                            '{"name": "Member #", "value": "$$guild.memberCount", "inline": true},' +
                            '{"name": "Role", "value": "$$data[welcomeRole].name", "inline": true}' +
                        '],' +
                        '"timestamp": true' +
                    '}],' +

                    // Add welcome reaction
                    '$message[{' +
                        '"action": "react",' +
                        '"emoji": "👋"' +
                    '}],' +

                    // Store welcome data
                    '$data[{' +
                        '"action": "set",' +
                        '"key": "welcomes.$$mentions[0].id",' +
                        '"value": {' +
                            '"timestamp": "$$timestamp",' +
                            '"by": "$$author.tag",' +
                            '"role": "$$data[welcomeRole]"' +
                        '"}' +
                    '}]' +
                ']' +
            '"}]",' +
            '"else": "$say[You need MANAGE_ROLES permission]"' +
        '}]',

    // Optional direct execution method
    async execute(message, args, client) {
        // Command can also be executed programmatically
        const mentioned = message.mentions.members.first();
        if (!mentioned) return message.reply('Please mention a user');

        const welcomeRole = await message.guild.roles.cache.find(r => r.name === 'Welcomed') ||
            await message.guild.roles.create({
                name: 'Welcomed',
                color: 'BLUE',
                reason: 'Welcome system role'
            });

        await mentioned.roles.add(welcomeRole);
        
        const embed = {
            title: 'Welcome!',
            description: `Welcome ${mentioned} to the server!`,
            color: 'BLUE',
            thumbnail: { url: mentioned.user.displayAvatarURL() },
            fields: [
                { name: 'Member #', value: message.guild.memberCount.toString(), inline: true },
                { name: 'Role', value: welcomeRole.name, inline: true }
            ],
            timestamp: new Date()
        };

        const response = await message.channel.send({ embeds: [embed] });
        await response.react('👋');

        // Store welcome data
        client.variables.set(`welcomes.${mentioned.id}`, {
            timestamp: Date.now(),
            by: message.author.tag,
            role: welcomeRole.id
        });
    }
};
