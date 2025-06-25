/**
 * Button charm - Create interactive buttons
 * Tier 2 primitive for button components
 * 
 * Examples:
 * $button[{ "id": "accept", "label": "Accept", "style": "SUCCESS" }] - Create button
 * $button[row, [button1, button2, button3]] - Create button row
 * $button[disable, "button_id"] - Disable button
 */
module.exports = {
    name: 'button',
    description: 'Create and manage interactive buttons',
    tier: 2,

    async execute(args, context) {
        const { 
            action = 'create',
            id,
            label,
            style = 'PRIMARY',
            emoji,
            url,
            disabled = false,
            buttons,
            row
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
                return this.createButton(args);

            case 'row':
                return this.createButtonRow(buttons || row || args.buttons);

            case 'disable':
                return this.disableButton(id);

            case 'enable':
                return this.enableButton(id);

            case 'update':
                return this.updateButton(id, args);

            default:
                // If no action specified, treat as create
                return this.createButton(args);
        }
    },

    /**
     * Create a single button
     */
    createButton(options) {
        const { 
            id, 
            label, 
            style = 'PRIMARY', 
            emoji, 
            url, 
            disabled = false 
        } = options;

        if (!id && !url) {
            throw new Error('Button must have either an ID or URL');
        }

        if (!label && !emoji) {
            throw new Error('Button must have either a label or emoji');
        }

        // Validate style
        const validStyles = ['PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER', 'LINK'];
        const buttonStyle = style.toUpperCase();
        
        if (!validStyles.includes(buttonStyle)) {
            throw new Error(`Invalid button style: ${style}. Valid styles: ${validStyles.join(', ')}`);
        }

        // For LINK style, URL is required
        if (buttonStyle === 'LINK' && !url) {
            throw new Error('LINK style buttons require a URL');
        }

        // For non-LINK styles, custom_id is required
        if (buttonStyle !== 'LINK' && !id) {
            throw new Error('Non-LINK buttons require a custom_id');
        }

        const button = {
            type: 2, // Button component type
            style: this.getButtonStyleNumber(buttonStyle),
            disabled: Boolean(disabled)
        };

        // Add label if provided
        if (label) {
            button.label = label.toString();
        }

        // Add emoji if provided
        if (emoji) {
            button.emoji = this.parseEmoji(emoji);
        }

        // Add custom_id or url based on style
        if (buttonStyle === 'LINK') {
            button.url = url;
        } else {
            button.custom_id = id;
        }

        return button;
    },

    /**
     * Create a row of buttons (max 5 buttons per row)
     */
    createButtonRow(buttons) {
        if (!Array.isArray(buttons)) {
            throw new Error('Button row requires an array of buttons');
        }

        if (buttons.length === 0) {
            throw new Error('Button row must contain at least one button');
        }

        if (buttons.length > 5) {
            throw new Error('Button row can contain maximum 5 buttons');
        }

        // Process each button
        const processedButtons = buttons.map(button => {
            if (typeof button === 'object' && button.type === 2) {
                // Already a processed button
                return button;
            } else {
                // Process as button options
                return this.createButton(button);
            }
        });

        return {
            type: 1, // Action row component type
            components: processedButtons
        };
    },

    /**
     * Disable a button (returns updated button object)
     */
    disableButton(buttonId) {
        if (!buttonId) {
            throw new Error('Button ID is required');
        }

        return {
            type: 2,
            custom_id: buttonId,
            disabled: true
        };
    },

    /**
     * Enable a button (returns updated button object)
     */
    enableButton(buttonId) {
        if (!buttonId) {
            throw new Error('Button ID is required');
        }

        return {
            type: 2,
            custom_id: buttonId,
            disabled: false
        };
    },

    /**
     * Update button properties
     */
    updateButton(buttonId, updates) {
        if (!buttonId) {
            throw new Error('Button ID is required');
        }

        const button = {
            type: 2,
            custom_id: buttonId
        };

        // Apply updates
        if (updates.label !== undefined) {
            button.label = updates.label.toString();
        }

        if (updates.style !== undefined) {
            button.style = this.getButtonStyleNumber(updates.style.toUpperCase());
        }

        if (updates.emoji !== undefined) {
            button.emoji = this.parseEmoji(updates.emoji);
        }

        if (updates.disabled !== undefined) {
            button.disabled = Boolean(updates.disabled);
        }

        if (updates.url !== undefined) {
            button.url = updates.url;
            button.style = 5; // LINK style
            delete button.custom_id; // Remove custom_id for link buttons
        }

        return button;
    },

    /**
     * Convert style name to Discord style number
     */
    getButtonStyleNumber(styleName) {
        const styles = {
            'PRIMARY': 1,
            'SECONDARY': 2,
            'SUCCESS': 3,
            'DANGER': 4,
            'LINK': 5
        };

        return styles[styleName] || 1;
    },

    /**
     * Parse emoji string to emoji object
     */
    parseEmoji(emoji) {
        if (typeof emoji === 'object') {
            return emoji;
        }

        const emojiString = emoji.toString();

        // Check if it's a custom emoji <:name:id> or <a:name:id>
        const customEmojiMatch = emojiString.match(/^<(a?):([^:]+):(\d+)>$/);
        if (customEmojiMatch) {
            return {
                name: customEmojiMatch[2],
                id: customEmojiMatch[3],
                animated: customEmojiMatch[1] === 'a'
            };
        }

        // Check if it's just an emoji ID
        if (/^\d+$/.test(emojiString)) {
            return {
                id: emojiString,
                name: null,
                animated: false
            };
        }

        // Assume it's a unicode emoji or emoji name
        return {
            name: emojiString,
            id: null,
            animated: false
        };
    }
};
