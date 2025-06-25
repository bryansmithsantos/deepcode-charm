/**
 * Category charm - Manage channel categories
 * Tier 2 primitive for category operations
 * 
 * Examples:
 * $category[create, { "name": "General" }] - Create category
 * $category[delete, categoryId] - Delete category
 * $category[list] - List all categories
 */
module.exports = {
    name: 'category',
    description: 'Manage channel categories',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $category[categoryName]
        if (typeof args === 'string') {
            return await this.getCategory(args, context);
        }

        const { 
            action = 'get', 
            name, 
            id, 
            position, 
            reason = 'Category managed via bot',
            format = 'object'
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
                return await this.createCategory(name, args, context, reason);

            case 'delete':
            case 'remove':
                return await this.deleteCategory(id || name, context, reason);

            case 'edit':
            case 'update':
                return await this.editCategory(id || name, args, context, reason);

            case 'list':
                return await this.listCategories(context, format);

            case 'get':
            case 'info':
                return await this.getCategory(id || name, context);

            case 'channels':
                return await this.getCategoryChannels(id || name, context, format);

            default:
                throw new Error(`Unknown category action: ${action}`);
        }
    },

    /**
     * Create category
     */
    async createCategory(name, options, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_CHANNELS')) {
                throw new Error('You do not have permission to manage channels');
            }

            if (!name) {
                throw new Error('Category name is required');
            }

            const { position, permissions } = options;
            const guild = context.message.guild;

            const categoryOptions = {
                name: name,
                type: 4, // Category channel type
                reason: reason
            };

            if (position !== undefined) {
                categoryOptions.position = parseInt(position);
            }

            if (permissions) {
                categoryOptions.permissionOverwrites = this.processPermissions(permissions);
            }

            const category = await guild.channels.create(categoryOptions);

            return {
                success: true,
                category: {
                    id: category.id,
                    name: category.name,
                    position: category.position,
                    createdAt: category.createdAt,
                    guild: {
                        id: category.guild.id,
                        name: category.guild.name
                    }
                }
            };

        } catch (error) {
            throw new Error(`Failed to create category: ${error.message}`);
        }
    },

    /**
     * Delete category
     */
    async deleteCategory(identifier, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_CHANNELS')) {
                throw new Error('You do not have permission to manage channels');
            }

            const category = await this.findCategory(identifier, context);
            if (!category) {
                throw new Error('Category not found');
            }

            await category.delete(reason);

            return {
                success: true,
                deletedCategory: {
                    id: category.id,
                    name: category.name,
                    channelCount: category.children.cache.size
                }
            };

        } catch (error) {
            throw new Error(`Failed to delete category: ${error.message}`);
        }
    },

    /**
     * Edit category
     */
    async editCategory(identifier, options, context, reason) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('MANAGE_CHANNELS')) {
                throw new Error('You do not have permission to manage channels');
            }

            const category = await this.findCategory(identifier, context);
            if (!category) {
                throw new Error('Category not found');
            }

            const { newName, newPosition, permissions } = options;
            const editOptions = {};

            if (newName) editOptions.name = newName;
            if (newPosition !== undefined) editOptions.position = parseInt(newPosition);
            if (permissions) editOptions.permissionOverwrites = this.processPermissions(permissions);

            const editedCategory = await category.edit(editOptions, reason);

            return {
                success: true,
                category: {
                    id: editedCategory.id,
                    name: editedCategory.name,
                    position: editedCategory.position,
                    channelCount: editedCategory.children.cache.size
                }
            };

        } catch (error) {
            throw new Error(`Failed to edit category: ${error.message}`);
        }
    },

    /**
     * List all categories
     */
    async listCategories(context, format) {
        try {
            const guild = context.message.guild;
            const categories = guild.channels.cache
                .filter(channel => channel.type === 4)
                .sort((a, b) => a.position - b.position);

            const categoryList = Array.from(categories.values()).map(category => ({
                id: category.id,
                name: category.name,
                position: category.position,
                channelCount: category.children.cache.size,
                channels: Array.from(category.children.cache.values()).map(ch => ({
                    id: ch.id,
                    name: ch.name,
                    type: ch.type
                })),
                createdAt: category.createdAt
            }));

            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(categoryList);
                case 'count':
                    return categoryList.length;
                case 'names':
                    return categoryList.map(c => c.name);
                case 'ids':
                    return categoryList.map(c => c.id);
                case 'array':
                default:
                    return categoryList;
            }

        } catch (error) {
            throw new Error(`Failed to list categories: ${error.message}`);
        }
    },

    /**
     * Get category info
     */
    async getCategory(identifier, context) {
        try {
            const category = await this.findCategory(identifier, context);
            if (!category) {
                throw new Error('Category not found');
            }

            return {
                id: category.id,
                name: category.name,
                position: category.position,
                channelCount: category.children.cache.size,
                channels: Array.from(category.children.cache.values()).map(ch => ({
                    id: ch.id,
                    name: ch.name,
                    type: ch.type,
                    position: ch.position
                })),
                permissions: category.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                })),
                createdAt: category.createdAt,
                guild: {
                    id: category.guild.id,
                    name: category.guild.name
                }
            };

        } catch (error) {
            throw new Error(`Failed to get category: ${error.message}`);
        }
    },

    /**
     * Get channels in category
     */
    async getCategoryChannels(identifier, context, format) {
        try {
            const category = await this.findCategory(identifier, context);
            if (!category) {
                throw new Error('Category not found');
            }

            const channels = Array.from(category.children.cache.values())
                .sort((a, b) => a.position - b.position)
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    createdAt: channel.createdAt
                }));

            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(channels);
                case 'count':
                    return channels.length;
                case 'names':
                    return channels.map(c => c.name);
                case 'ids':
                    return channels.map(c => c.id);
                case 'array':
                default:
                    return channels;
            }

        } catch (error) {
            throw new Error(`Failed to get category channels: ${error.message}`);
        }
    },

    /**
     * Find category by name or ID
     */
    async findCategory(identifier, context) {
        const guild = context.message.guild;
        
        // Try to find by ID first
        let category = guild.channels.cache.get(identifier);
        if (category && category.type === 4) {
            return category;
        }

        // Try to find by name
        category = guild.channels.cache.find(ch => 
            ch.type === 4 && ch.name.toLowerCase() === identifier.toLowerCase()
        );

        return category || null;
    },

    /**
     * Process permissions for category creation/editing
     */
    processPermissions(permissions) {
        if (!Array.isArray(permissions)) {
            return [];
        }

        return permissions.map(perm => ({
            id: perm.id,
            type: perm.type || 0, // 0 = role, 1 = member
            allow: perm.allow || [],
            deny: perm.deny || []
        }));
    }
};
