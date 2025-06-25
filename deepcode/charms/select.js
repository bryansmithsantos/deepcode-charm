/**
 * Select charm - Create select menus (dropdowns)
 * Tier 2 primitive for select menu components
 * 
 * Examples:
 * $select[{ "id": "role_select", "placeholder": "Choose a role", "options": [...] }] - Create select menu
 * $select[option, { "label": "Option 1", "value": "opt1", "description": "First option" }] - Create option
 * $select[update, { "id": "menu_id", "disabled": true }] - Update select menu
 */
module.exports = {
    name: 'select',
    description: 'Create and manage select menus (dropdowns)',
    tier: 2,

    async execute(args, context) {
        const { 
            action = 'create',
            id,
            placeholder,
            options = [],
            minValues = 1,
            maxValues = 1,
            disabled = false,
            type = 'string'
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
                return this.createSelectMenu(args);

            case 'option':
                return this.createOption(args);

            case 'update':
                return this.updateSelectMenu(id, args);

            case 'disable':
                return this.disableSelectMenu(id);

            case 'enable':
                return this.enableSelectMenu(id);

            case 'row':
                return this.createSelectRow(args);

            default:
                // If no action specified, treat as create
                return this.createSelectMenu(args);
        }
    },

    /**
     * Create a select menu
     */
    createSelectMenu(options) {
        const { 
            id, 
            placeholder = 'Make a selection...', 
            options: menuOptions = [], 
            minValues = 1, 
            maxValues = 1, 
            disabled = false,
            type = 'string'
        } = options;

        if (!id) {
            throw new Error('Select menu must have a custom_id');
        }

        if (!Array.isArray(menuOptions) || menuOptions.length === 0) {
            throw new Error('Select menu must have at least one option');
        }

        if (menuOptions.length > 25) {
            throw new Error('Select menu can have maximum 25 options');
        }

        // Validate min/max values
        const min = Math.max(0, Math.min(25, parseInt(minValues)));
        const max = Math.max(min, Math.min(25, parseInt(maxValues)));

        // Determine select menu type
        let selectType = 3; // String select (default)
        switch (type.toLowerCase()) {
            case 'user':
                selectType = 5;
                break;
            case 'role':
                selectType = 6;
                break;
            case 'mentionable':
                selectType = 7;
                break;
            case 'channel':
                selectType = 8;
                break;
            case 'string':
            default:
                selectType = 3;
                break;
        }

        const selectMenu = {
            type: selectType,
            custom_id: id,
            placeholder: placeholder.toString(),
            min_values: min,
            max_values: max,
            disabled: Boolean(disabled)
        };

        // Only add options for string select menus
        if (selectType === 3) {
            selectMenu.options = menuOptions.map(option => this.createOption(option));
        }

        return selectMenu;
    },

    /**
     * Create a select menu option
     */
    createOption(optionData) {
        const { 
            label, 
            value, 
            description, 
            emoji, 
            default: isDefault = false 
        } = optionData;

        if (!label) {
            throw new Error('Select option must have a label');
        }

        if (!value) {
            throw new Error('Select option must have a value');
        }

        const option = {
            label: label.toString(),
            value: value.toString(),
            default: Boolean(isDefault)
        };

        // Add description if provided (max 100 characters)
        if (description) {
            option.description = description.toString().substring(0, 100);
        }

        // Add emoji if provided
        if (emoji) {
            option.emoji = this.parseEmoji(emoji);
        }

        return option;
    },

    /**
     * Update select menu properties
     */
    updateSelectMenu(menuId, updates) {
        if (!menuId) {
            throw new Error('Select menu ID is required');
        }

        const selectMenu = {
            type: 3, // String select
            custom_id: menuId
        };

        // Apply updates
        if (updates.placeholder !== undefined) {
            selectMenu.placeholder = updates.placeholder.toString();
        }

        if (updates.minValues !== undefined) {
            selectMenu.min_values = Math.max(0, Math.min(25, parseInt(updates.minValues)));
        }

        if (updates.maxValues !== undefined) {
            selectMenu.max_values = Math.max(1, Math.min(25, parseInt(updates.maxValues)));
        }

        if (updates.disabled !== undefined) {
            selectMenu.disabled = Boolean(updates.disabled);
        }

        if (updates.options !== undefined) {
            if (!Array.isArray(updates.options)) {
                throw new Error('Options must be an array');
            }
            selectMenu.options = updates.options.map(option => this.createOption(option));
        }

        return selectMenu;
    },

    /**
     * Disable select menu
     */
    disableSelectMenu(menuId) {
        if (!menuId) {
            throw new Error('Select menu ID is required');
        }

        return {
            type: 3,
            custom_id: menuId,
            disabled: true
        };
    },

    /**
     * Enable select menu
     */
    enableSelectMenu(menuId) {
        if (!menuId) {
            throw new Error('Select menu ID is required');
        }

        return {
            type: 3,
            custom_id: menuId,
            disabled: false
        };
    },

    /**
     * Create action row with select menu
     */
    createSelectRow(selectMenu) {
        let menu;

        if (typeof selectMenu === 'object' && selectMenu.type >= 3 && selectMenu.type <= 8) {
            // Already a processed select menu
            menu = selectMenu;
        } else {
            // Process as select menu options
            menu = this.createSelectMenu(selectMenu);
        }

        return {
            type: 1, // Action row component type
            components: [menu]
        };
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
