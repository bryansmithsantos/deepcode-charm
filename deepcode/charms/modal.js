/**
 * Modal charm - Create modal forms and dialogs
 * Tier 3 primitive for interactive forms
 * 
 * Examples:
 * $modal[create, { "id": "user_form", "title": "User Information", "components": [...] }] - Create modal
 * $modal[field, { "id": "username", "label": "Username", "required": true }] - Create text field
 * $modal[show, { "modal": modalObject, "interaction": interaction }] - Show modal
 */
module.exports = {
    name: 'modal',
    description: 'Create modal forms and interactive dialogs',
    tier: 3,

    async execute(args, context) {
        const { 
            action = 'create',
            id,
            title,
            components = [],
            label,
            placeholder,
            required = false,
            minLength,
            maxLength,
            style = 'SHORT',
            value
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
                return this.createModal(id, title, components);

            case 'field':
            case 'input':
                return this.createTextField(args);

            case 'row':
                return this.createActionRow(components);

            case 'show':
            case 'display':
                return await this.showModal(args, context);

            case 'validate':
                return this.validateModal(args);

            default:
                throw new Error(`Unknown modal action: ${action}`);
        }
    },

    /**
     * Create modal
     */
    createModal(modalId, modalTitle, modalComponents) {
        if (!modalId) {
            throw new Error('Modal ID is required');
        }

        if (!modalTitle) {
            throw new Error('Modal title is required');
        }

        if (!Array.isArray(modalComponents) || modalComponents.length === 0) {
            throw new Error('Modal must have at least one component');
        }

        if (modalComponents.length > 5) {
            throw new Error('Modal can have maximum 5 action rows');
        }

        // Process components
        const processedComponents = modalComponents.map(component => {
            if (typeof component === 'object' && component.type === 1) {
                // Already an action row
                return component;
            } else {
                // Wrap in action row
                return this.createActionRow([component]);
            }
        });

        const modal = {
            type: 9, // Modal type
            custom_id: modalId,
            title: modalTitle,
            components: processedComponents
        };

        return modal;
    },

    /**
     * Create text input field
     */
    createTextField(options) {
        const { 
            id, 
            label, 
            placeholder, 
            required = false, 
            minLength, 
            maxLength, 
            style = 'SHORT',
            value
        } = options;

        if (!id) {
            throw new Error('Field ID is required');
        }

        if (!label) {
            throw new Error('Field label is required');
        }

        // Validate style
        const validStyles = ['SHORT', 'PARAGRAPH'];
        const textStyle = style.toUpperCase();
        
        if (!validStyles.includes(textStyle)) {
            throw new Error(`Invalid text input style: ${style}. Valid styles: ${validStyles.join(', ')}`);
        }

        const textInput = {
            type: 4, // Text input component type
            custom_id: id,
            label: label,
            style: textStyle === 'SHORT' ? 1 : 2,
            required: Boolean(required)
        };

        // Optional properties
        if (placeholder) {
            textInput.placeholder = placeholder.toString();
        }

        if (value !== undefined) {
            textInput.value = value.toString();
        }

        if (minLength !== undefined) {
            textInput.min_length = Math.max(0, Math.min(4000, parseInt(minLength)));
        }

        if (maxLength !== undefined) {
            textInput.max_length = Math.max(1, Math.min(4000, parseInt(maxLength)));
        }

        return textInput;
    },

    /**
     * Create action row
     */
    createActionRow(components) {
        if (!Array.isArray(components)) {
            throw new Error('Action row requires an array of components');
        }

        if (components.length === 0) {
            throw new Error('Action row must contain at least one component');
        }

        if (components.length > 1) {
            throw new Error('Modal action row can contain only one text input component');
        }

        // Process component
        const component = components[0];
        let processedComponent;

        if (typeof component === 'object' && component.type === 4) {
            // Already a text input component
            processedComponent = component;
        } else {
            // Process as text input options
            processedComponent = this.createTextField(component);
        }

        return {
            type: 1, // Action row component type
            components: [processedComponent]
        };
    },

    /**
     * Show modal (for interactions)
     */
    async showModal(options, context) {
        const { modal, interaction } = options;

        if (!modal) {
            throw new Error('Modal object is required');
        }

        if (!interaction) {
            throw new Error('Interaction is required to show modal');
        }

        try {
            await interaction.showModal(modal);

            return {
                success: true,
                modalId: modal.custom_id,
                title: modal.title,
                shown: true
            };
        } catch (error) {
            throw new Error(`Failed to show modal: ${error.message}`);
        }
    },

    /**
     * Validate modal structure
     */
    validateModal(modal) {
        if (!modal || typeof modal !== 'object') {
            return {
                valid: false,
                errors: ['Modal must be an object']
            };
        }

        const errors = [];

        // Check required properties
        if (!modal.custom_id) {
            errors.push('Modal must have a custom_id');
        }

        if (!modal.title) {
            errors.push('Modal must have a title');
        }

        if (!modal.components || !Array.isArray(modal.components)) {
            errors.push('Modal must have components array');
        } else {
            // Validate components
            if (modal.components.length === 0) {
                errors.push('Modal must have at least one component');
            }

            if (modal.components.length > 5) {
                errors.push('Modal can have maximum 5 components');
            }

            // Validate each component
            modal.components.forEach((component, index) => {
                if (!component || typeof component !== 'object') {
                    errors.push(`Component ${index} must be an object`);
                    return;
                }

                if (component.type !== 1) {
                    errors.push(`Component ${index} must be an action row (type 1)`);
                    return;
                }

                if (!component.components || !Array.isArray(component.components)) {
                    errors.push(`Component ${index} must have components array`);
                    return;
                }

                if (component.components.length !== 1) {
                    errors.push(`Component ${index} must have exactly one text input`);
                    return;
                }

                const textInput = component.components[0];
                if (!textInput || textInput.type !== 4) {
                    errors.push(`Component ${index} must contain a text input (type 4)`);
                    return;
                }

                if (!textInput.custom_id) {
                    errors.push(`Text input in component ${index} must have custom_id`);
                }

                if (!textInput.label) {
                    errors.push(`Text input in component ${index} must have label`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};
