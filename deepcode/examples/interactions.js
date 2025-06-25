/**
 * Interactions Example - Advanced interaction handling
 */
module.exports = {
    name: 'menu',
    description: 'Interactive menu system',
    tier: 3,
    
    code: 
        // Create menu message
        '$message[{' +
            'action: "send",' +
            'options: {' +
                // Main embed
                'embeds: [{' +
                    'title: "Interactive Menu",' +
                    'description: "Select options below to interact",' +
                    'color: "BLUE"' +
                '}],' +
                // Add components
                'components: [' +
                    // Row 1: Main buttons
                    '$component[{' +
                        'action: "create",' +
                        'type: "row",' +
                        'options: {' +
                            'components: [' +
                                // Profile button
                                '{' +
                                    'type: "button",' +
                                    'style: "PRIMARY",' +
                                    'label: "Profile",' +
                                    'customId: "menu_profile",' +
                                    'emoji: "👤"' +
                                '},' +
                                // Settings button
                                '{' +
                                    'type: "button",' +
                                    'style: "SECONDARY",' +
                                    'label: "Settings",' +
                                    'customId: "menu_settings",' +
                                    'emoji: "⚙️"' +
                                '},' +
                                // Help button
                                '{' +
                                    'type: "button",' +
                                    'style: "SUCCESS",' +
                                    'label: "Help",' +
                                    'customId: "menu_help",' +
                                    'emoji: "❓"' +
                                '}' +
                            ']' +
                        '}' +
                    '}],' +
                    // Row 2: Select menu
                    '$component[{' +
                        'action: "create",' +
                        'type: "row",' +
                        'options: {' +
                            'components: [{' +
                                'type: "select",' +
                                'customId: "menu_select",' +
                                'placeholder: "Choose an option...",' +
                                'options: [' +
                                    '{' +
                                        'label: "View Statistics",' +
                                        'value: "stats",' +
                                        'description: "View your statistics",' +
                                        'emoji: "📊"' +
                                    '},' +
                                    '{' +
                                        'label: "Manage Roles",' +
                                        'value: "roles",' +
                                        'description: "Manage your roles",' +
                                        'emoji: "🎭"' +
                                    '},' +
                                    '{' +
                                        'label: "Server Info",' +
                                        'value: "server",' +
                                        'description: "View server information",' +
                                        'emoji: "🏠"' +
                                    '}' +
                                ']' +
                            '}]' +
                        '}' +
                    '}]' +
                ']' +
            '}' +
        '}]',

    // Button handlers
    buttons: {
        menu_profile: {
            async execute(interaction) {
                await interaction.reply({
                    embeds: [{
                        title: 'User Profile',
                        fields: [
                            {
                                name: 'Username',
                                value: interaction.user.tag,
                                inline: true
                            },
                            {
                                name: 'Joined',
                                value: interaction.member.joinedAt.toLocaleDateString(),
                                inline: true
                            },
                            {
                                name: 'Roles',
                                value: interaction.member.roles.cache
                                    .map(r => r.name)
                                    .join(', ') || 'None'
                            }
                        ],
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }],
                    ephemeral: true
                });
            }
        },

        menu_settings: {
            async execute(interaction) {
                await interaction.showModal({
                    title: 'User Settings',
                    customId: 'settings_modal',
                    components: [
                        {
                            type: 1,
                            components: [{
                                type: 4,
                                customId: 'nickname',
                                label: 'Nickname',
                                style: 1,
                                minLength: 2,
                                maxLength: 32,
                                placeholder: 'Enter new nickname',
                                required: false
                            }]
                        },
                        {
                            type: 1,
                            components: [{
                                type: 4,
                                customId: 'color',
                                label: 'Color',
                                style: 1,
                                placeholder: 'Enter hex color (e.g. #FF0000)',
                                required: false
                            }]
                        }
                    ]
                });
            }
        },

        menu_help: {
            async execute(interaction) {
                await interaction.reply({
                    embeds: [{
                        title: 'Help Menu',
                        description: 'Available commands and features',
                        fields: [
                            {
                                name: 'Profile',
                                value: 'View your user profile'
                            },
                            {
                                name: 'Settings',
                                value: 'Change your preferences'
                            },
                            {
                                name: 'Statistics',
                                value: 'View activity stats'
                            }
                        ],
                        footer: {
                            text: 'Use the buttons and select menu to navigate'
                        }
                    }],
                    ephemeral: true
                });
            }
        }
    },

    // Select menu handler
    selects: {
        menu_select: {
            async execute(interaction) {
                const value = interaction.values[0];

                switch (value) {
                    case 'stats':
                        await this.showStats(interaction);
                        break;
                    case 'roles':
                        await this.showRoles(interaction);
                        break;
                    case 'server':
                        await this.showServer(interaction);
                        break;
                }
            }
        }
    },

    // Modal handler
    modals: {
        settings_modal: {
            async execute(interaction) {
                const nickname = interaction.fields.getTextInputValue('nickname');
                const color = interaction.fields.getTextInputValue('color');

                if (nickname) {
                    await interaction.member.setNickname(nickname);
                }

                if (color && /^#[0-9A-F]{6}$/i.test(color)) {
                    const role = interaction.member.roles.color;
                    if (role) {
                        await role.edit({ color });
                    }
                }

                await interaction.reply({
                    content: 'Settings updated!',
                    ephemeral: true
                });
            }
        }
    },

    // Helper methods
    async showStats(interaction) {
        await interaction.reply({
            embeds: [{
                title: 'User Statistics',
                fields: [
                    {
                        name: 'Messages',
                        value: '1,234',
                        inline: true
                    },
                    {
                        name: 'Commands',
                        value: '567',
                        inline: true
                    },
                    {
                        name: 'Voice Time',
                        value: '24h',
                        inline: true
                    }
                ]
            }],
            ephemeral: true
        });
    },

    async showRoles(interaction) {
        const roles = interaction.member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position);

        await interaction.reply({
            embeds: [{
                title: 'Your Roles',
                description: roles.map(r => 
                    `${r} - ${r.members.size} members`
                ).join('\n') || 'No roles'
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 3,
                            customId: 'role_select',
                            placeholder: 'Select roles to toggle...',
                            minValues: 0,
                            maxValues: roles.size,
                            options: roles.map(r => ({
                                label: r.name,
                                value: r.id,
                                description: `${r.members.size} members`,
                                default: interaction.member.roles.cache.has(r.id)
                            }))
                        }
                    ]
                }
            ],
            ephemeral: true
        });
    },

    async showServer(interaction) {
        const guild = interaction.guild;
        
        await interaction.reply({
            embeds: [{
                title: guild.name,
                thumbnail: {
                    url: guild.iconURL()
                },
                fields: [
                    {
                        name: 'Owner',
                        value: `<@${guild.ownerId}>`,
                        inline: true
                    },
                    {
                        name: 'Members',
                        value: guild.memberCount.toString(),
                        inline: true
                    },
                    {
                        name: 'Channels',
                        value: guild.channels.cache.size.toString(),
                        inline: true
                    },
                    {
                        name: 'Roles',
                        value: guild.roles.cache.size.toString(),
                        inline: true
                    },
                    {
                        name: 'Boost Level',
                        value: guild.premiumTier,
                        inline: true
                    },
                    {
                        name: 'Created',
                        value: guild.createdAt.toLocaleDateString(),
                        inline: true
                    }
                ]
            }],
            ephemeral: true
        });
    }
};
