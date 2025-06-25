/**
 * Ticket System Example - Complete ticket management
 */
module.exports = {
    name: 'tickets',
    description: 'Advanced ticket management system',
    tier: 3,

    // Initialize command
    code: '$condition[{' +
        '"left": "$$args[0]",' +
        '"operator": "exists",' +
        '"then": "$$handleSubcommand",' +
        '"else": "$$createTicketPanel"' +
    '}]',

    // Custom variables
    variables: {
        createTicketPanel: (context) => {
            return '$message[{' +
                'action: "send",' +
                'options: {' +
                    'embeds: [{' +
                        'title: "Support Tickets",' +
                        'description: "Click the button below to create a support ticket",' +
                        'color: "BLUE",' +
                        'footer: {' +
                            'text: "Support ticket system"' +
                        '}' +
                    '}],' +
                    'components: [' +
                        '$component[{' +
                            'action: "create",' +
                            'type: "row",' +
                            'options: {' +
                                'components: [{' +
                                    'type: "button",' +
                                    'style: "PRIMARY",' +
                                    'label: "Create Ticket",' +
                                    'customId: "create_ticket",' +
                                    'emoji: "🎫"' +
                                '}]' +
                            '}' +
                        '}]' +
                    ']' +
                '}' +
            '}]';
        },

        handleSubcommand: (context) => {
            const subcommand = context.args[0].toLowerCase();
            
            switch (subcommand) {
                case 'setup':
                    return '$sequence[{' +
                        'actions: [' +
                            // Create category
                            '$channel[{' +
                                'action: "create",' +
                                'options: {' +
                                    'name: "tickets",' +
                                    'type: "GUILD_CATEGORY"' +
                                '}' +
                            '}],' +
                            // Store category ID
                            '$data[{' +
                                'action: "set",' +
                                'key: "tickets.category",' +
                                'value: "$$lastChannelId"' +
                            '}],' +
                            // Create log channel
                            '$channel[{' +
                                'action: "create",' +
                                'options: {' +
                                    'name: "ticket-logs",' +
                                    'parent: "$$lastChannelId",' +
                                    'topic: "Ticket system logs"' +
                                '}' +
                            '}],' +
                            // Store log channel
                            '$data[{' +
                                'action: "set",' +
                                'key: "tickets.logs",' +
                                'value: "$$lastChannelId"' +
                            '}],' +
                            // Create panel
                            '$$createTicketPanel' +
                        ']' +
                    '}]';

                case 'add':
                    return '$condition[{' +
                        'left: "$$mentions[0]",' +
                        'operator: "exists",' +
                        'then: "$sequence[{' +
                            'actions: [' +
                                // Add member to ticket
                                '$channel[{' +
                                    'action: "setPerms",' +
                                    'id: "$$channel.id",' +
                                    'options: {' +
                                        'target: "$$mentions[0]",' +
                                        'allow: ["VIEW_CHANNEL"]' +
                                    '}' +
                                '}],' +
                                // Send notification
                                '$say[Added $$mentions[0] to ticket]' +
                            ']' +
                        '}]",' +
                        'else: "$say[Please mention a user]"' +
                    '}]';

                case 'remove':
                    return '$condition[{' +
                        'left: "$$mentions[0]",' +
                        'operator: "exists",' +
                        'then: "$sequence[{' +
                            'actions: [' +
                                // Remove member from ticket
                                '$channel[{' +
                                    'action: "setPerms",' +
                                    'id: "$$channel.id",' +
                                    'options: {' +
                                        'target: "$$mentions[0]",' +
                                        'deny: ["VIEW_CHANNEL"]' +
                                    '}' +
                                '}],' +
                                // Send notification
                                '$say[Removed $$mentions[0] from ticket]' +
                            ']' +
                        '}]",' +
                        'else: "$say[Please mention a user]"' +
                    '}]';

                case 'close':
                    return '$sequence[{' +
                        'actions: [' +
                            // Archive messages
                            '$$archiveTicket,' +
                            // Close channel
                            '$channel[{' +
                                'action: "delete",' +
                                'id: "$$channel.id"' +
                            '}]' +
                        ']' +
                    '}]';

                default:
                    return '$say[Invalid subcommand. Available: setup, add, remove, close]';
            }
        },

        archiveTicket: async (context) => {
            // Get messages
            const messages = await context.channel.messages.fetch();
            const archive = messages.reverse().map(m => ({
                author: m.author.tag,
                content: m.content,
                timestamp: m.createdAt
            }));

            // Create archive embed
            return '$message[{' +
                'action: "send",' +
                'channelId: "$$data[tickets.logs]",' +
                'options: {' +
                    'embeds: [{' +
                        'title: "Ticket Archive",' +
                        'description: "Ticket: ' + context.channel.name + '",' +
                        'fields: [' +
                            '{' +
                                'name: "Created By",' +
                                'value: "$$data[tickets.' + context.channel.id + '.creator]",' +
                                'inline: true' +
                            '},' +
                            '{' +
                                'name: "Created At",' +
                                'value: "$$data[tickets.' + context.channel.id + '.created]",' +
                                'inline: true' +
                            '},' +
                            '{' +
                                'name: "Messages",' +
                                'value: "' + messages.size + '",' +
                                'inline: true' +
                            '}' +
                        '],' +
                        'color: "RED"' +
                    '}],' +
                    'files: [{' +
                        'name: "transcript.json",' +
                        'attachment: ' + JSON.stringify(archive, null, 2) +
                    '}]' +
                '}' +
            '}]';
        }
    },

    // Button handlers
    buttons: {
        create_ticket: {
            async execute(interaction) {
                const category = await interaction.guild.channels.fetch(
                    await interaction.client.variables.get('tickets.category')
                );

                // Create ticket channel
                const channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 'GUILD_TEXT',
                    parent: category,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: ['VIEW_CHANNEL']
                        },
                        {
                            id: interaction.user.id,
                            allow: ['VIEW_CHANNEL']
                        }
                    ]
                });

                // Store ticket data
                await interaction.client.variables.set(
                    `tickets.${channel.id}`,
                    {
                        creator: interaction.user.tag,
                        created: new Date().toISOString(),
                        status: 'open'
                    }
                );

                // Send initial message
                await channel.send({
                    embeds: [{
                        title: 'Support Ticket',
                        description: `Welcome ${interaction.user}!\nSupport will be with you shortly.`,
                        fields: [
                            {
                                name: 'Commands',
                                value: 
                                    '`/tickets add @user` - Add user to ticket\n' +
                                    '`/tickets remove @user` - Remove user from ticket\n' +
                                    '`/tickets close` - Close ticket'
                            }
                        ],
                        color: 'GREEN'
                    }]
                });

                // Notify user
                await interaction.reply({
                    content: `Ticket created! ${channel}`,
                    ephemeral: true
                });
            }
        }
    }
};
