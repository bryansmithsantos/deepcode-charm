/**
 * Profile Example - Demonstrates validation usage
 * Shows how to use validation charms to handle user profile updates
 */

module.exports = {
    name: 'profile',
    description: 'Manage user profiles with validation',
    usage: '!profile <action> [...args]',
    examples: [
        '!profile set name John Doe',
        '!profile set age 25',
        '!profile set bio I love coding!',
        '!profile view'
    ],
    async execute(message, args) {
        const [action = 'view'] = args;

        // Profile schema for validation
        const profileSchema = {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 50,
                    pattern: '^[a-zA-Z0-9\\s]+$',
                    patternMessage: 'Name can only contain letters, numbers and spaces'
                },
                age: {
                    type: 'number',
                    min: 13,
                    max: 120,
                    integer: true
                },
                bio: {
                    type: 'string',
                    maxLength: 500
                },
                links: {
                    type: 'array',
                    maxItems: 5,
                    itemType: 'string',
                    itemRules: {
                        pattern: '^https?://',
                        patternMessage: 'Links must start with http:// or https://'
                    }
                },
                settings: {
                    type: 'object',
                    properties: {
                        private: { type: 'boolean' },
                        notifications: { type: 'boolean' },
                        theme: { 
                            type: 'string',
                            enum: ['light', 'dark', 'system']
                        }
                    }
                }
            }
        };

        // Handle different actions
        try {
            switch (action.toLowerCase()) {
                case 'set': {
                    const [field, ...values] = args.slice(1);
                    if (!field) {
                        throw new Error('Please specify a field to update');
                    }

                    // Get current profile
                    const profile = await bot.data.get(`profiles.${message.author.id}`) || {};
                    
                    // Handle field updates with validation
                    await bot.sequence([{
                        actions: [
                            // Validate field exists in schema
                            `$assert[$$profileSchema.properties[${field}]; Invalid profile field]`,
                            
                            // Parse and validate value
                            `$try[{
                                code: $sequence[{
                                    actions: [
                                        // Parse value based on type
                                        "$data[set; value; $switch[{
                                            value: $$profileSchema.properties[${field}].type,
                                            cases: {
                                                number: $number[${values.join(' ')}],
                                                boolean: $equal[${values.join(' ')}; true],
                                                array: $array[from; ${values.join(',')}],
                                                default: ${values.join(' ')}
                                            }
                                        }]]",

                                        // Validate value against schema
                                        "$validate[{
                                            value: $$data[get; value],
                                            ...$$profileSchema.properties[${field}]
                                        }]",

                                        // Update profile
                                        "$data[set; profiles.${message.author.id}.${field}; $$data[get; value]]",

                                        // Send success message
                                        "$embed[{
                                            title: 'Profile Updated',
                                            description: '${field} was updated successfully',
                                            color: 'GREEN'
                                        }]"
                                    ]
                                }],
                                catch: "$say[Validation error: $$error]"
                            }]`
                        ]
                    }]);
                    break;
                }

                case 'view': {
                    // Get and validate entire profile
                    await bot.sequence([{
                        actions: [
                            // Get profile
                            `$data[get; profiles.${message.author.id}]`,

                            // Validate full profile
                            `$try[{
                                code: $validate[{
                                    value: $$value,
                                    ...$$profileSchema
                                }],
                                catch: "$log[warn; Invalid profile data for ${message.author.id}]"
                            }]`,

                            // Display profile
                            `$embed[{
                                title: "Profile for ${message.author.username}",
                                fields: [
                                    { name: "Name", value: $$value.name || "Not set", inline: true },
                                    { name: "Age", value: $$value.age || "Not set", inline: true },
                                    { name: "Bio", value: $$value.bio || "No bio yet" },
                                    { name: "Links", value: $$value.links?.join('\\n') || "No links" }
                                ],
                                color: "BLUE"
                            }]`
                        ]
                    }]);
                    break;
                }

                case 'reset': {
                    // Clear profile with confirmation
                    await bot.sequence([{
                        actions: [
                            `$confirm[{
                                message: "Are you sure you want to reset your profile?",
                                timeout: 30,
                                onConfirm: "$sequence[{actions: [
                                    '$data[delete; profiles.${message.author.id}]',
                                    '$say[Profile reset successfully]'
                                ]}]",
                                onCancel: "$say[Profile reset cancelled]"
                            }]`
                        ]
                    }]);
                    break;
                }

                default:
                    throw new Error('Invalid action. Use set, view, or reset');
            }
        } catch (error) {
            await message.reply(`Error: ${error.message}`);
        }
    }
};
