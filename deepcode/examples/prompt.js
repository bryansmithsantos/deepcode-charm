/**
 * Prompt System Example - Shows advanced charm usage
 */
module.exports = {
    name: 'prompt',
    description: 'Interactive prompt system',
    usage: '<question>',
    tier: 2,
    cooldown: 5,
    
    code: 
        // Create unique ID for this prompt
        '$data[{' +
            'action: "set",' +
            'key: "prompt_$$timestamp",' +
            'value: {' +
                'question: "$$args",' +
                'author: "$$author.id",' +
                'timestamp: "$$timestamp",' +
                'responses: []' +
            '}' +
        '}]' +

        // Create prompt message
        '$message[{' +
            'action: "send",' +
            'options: {' +
                'embeds: [{' +
                    'title: "Question",' +
                    'description: "$$args",' +
                    'footer: {' +
                        'text: "Prompt ID: $$timestamp"' +
                    '}' +
                '}],' +
                'components: [' +
                    // Add answer button
                    '$component[{' +
                        'action: "create",' +
                        'type: "button",' +
                        'options: {' +
                            'label: "Answer",' +
                            'style: "PRIMARY",' +
                            'customId: "prompt_answer_$$timestamp"' +
                        '}' +
                    '}],' +
                    // Add view responses button
                    '$component[{' +
                        'action: "create",' +
                        'type: "button",' +
                        'options: {' +
                            'label: "View Responses",' +
                            'style: "SECONDARY",' +
                            'customId: "prompt_view_$$timestamp"' +
                        '}' +
                    '}],' +
                    // Add close button
                    '$condition[{' +
                        'left: "$$author.id",' +
                        'operator: "equals",' +
                        'right: "$$data[prompt_$$timestamp].author",' +
                        'then: "$component[{' +
                            'action: \"create\",' +
                            'type: \"button\",' +
                            'options: {' +
                                'label: \"Close\",' +
                                'style: \"DANGER\",' +
                                'customId: \"prompt_close_$$timestamp\"' +
                            '}' +
                        '}]"' +
                    '}]' +
                ']' +
            '}' +
        '}]',

    // Button handlers
    handlers: {
        // Answer button
        prompt_answer: {
            async execute(interaction, id) {
                // Show modal for answer
                await interaction.showModal({
                    title: 'Submit Answer',
                    customId: `prompt_submit_${id}`,
                    components: [{
                        type: 1,
                        components: [{
                            type: 4,
                            customId: 'answer',
                            label: 'Your Answer',
                            style: 2,
                            minLength: 1,
                            maxLength: 1000,
                            placeholder: 'Type your answer here...',
                            required: true
                        }]
                    }]
                });
            }
        },

        // Submit answer
        prompt_submit: {
            async execute(interaction, id) {
                const answer = interaction.fields.getTextInputValue('answer');

                // Add response to data
                await interaction.client.variables.update(`prompt_${id}.responses`, [{
                    user: interaction.user.id,
                    content: answer,
                    timestamp: Date.now()
                }]);

                await interaction.reply({
                    content: 'Your answer has been submitted!',
                    ephemeral: true
                });
            }
        },

        // View responses
        prompt_view: {
            async execute(interaction, id) {
                const prompt = await interaction.client.variables.get(`prompt_${id}`);
                if (!prompt) return;

                const responses = prompt.responses.map((r, i) => ({
                    name: `Response #${i + 1}`,
                    value: r.content,
                    inline: false
                }));

                await interaction.reply({
                    embeds: [{
                        title: 'Responses',
                        description: prompt.question,
                        fields: responses.length ? responses : [{
                            name: 'No Responses',
                            value: 'Be the first to answer!'
                        }],
                        footer: {
                            text: `Total Responses: ${responses.length}`
                        }
                    }],
                    ephemeral: true
                });
            }
        },

        // Close prompt
        prompt_close: {
            async execute(interaction, id) {
                const prompt = await interaction.client.variables.get(`prompt_${id}`);
                if (!prompt) return;

                // Verify ownership
                if (interaction.user.id !== prompt.author) {
                    return interaction.reply({
                        content: 'Only the prompt creator can close it.',
                        ephemeral: true
                    });
                }

                // Disable buttons
                await interaction.message.edit({
                    components: interaction.message.components.map(row => ({
                        type: row.type,
                        components: row.components.map(c => ({
                            ...c,
                            disabled: true
                        }))
                    }))
                });

                // Show final results
                await interaction.reply({
                    embeds: [{
                        title: 'Prompt Closed',
                        description: prompt.question,
                        fields: [
                            {
                                name: 'Total Responses',
                                value: String(prompt.responses.length),
                                inline: true
                            },
                            {
                                name: 'Duration',
                                value: this.getDuration(prompt.timestamp),
                                inline: true
                            }
                        ],
                        color: 'RED'
                    }]
                });

                // Clean up data
                await interaction.client.variables.delete(`prompt_${id}`);
            }
        }
    },

    // Utility methods
    getDuration(timestamp) {
        const duration = Date.now() - timestamp;
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
};
