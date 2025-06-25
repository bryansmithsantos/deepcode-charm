/**
 * Audit charm - Access Discord audit logs
 * Tier 2 primitive for audit log operations
 * 
 * Examples:
 * $audit[list] - List recent audit logs
 * $audit[get, { "action": "MEMBER_BAN_ADD", "limit": 10 }] - Get specific actions
 * $audit[user, "123456789"] - Get logs for specific user
 */
module.exports = {
    name: 'audit',
    description: 'Access Discord audit logs',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $audit[action]
        if (typeof args === 'string') {
            return await this.getAuditLogs(context, { action: args });
        }

        const { 
            action = 'list',
            user,
            target,
            limit = 50,
            before,
            after,
            type,
            format = 'array'
        } = args;

        switch (action.toLowerCase()) {
            case 'list':
                return await this.getAuditLogs(context, { limit, before, after, format });

            case 'get':
                return await this.getAuditLogs(context, args);

            case 'user':
                return await this.getUserAuditLogs(user || target, context, { limit, format });

            case 'action':
                return await this.getActionAuditLogs(type, context, { limit, format });

            case 'recent':
                return await this.getRecentAuditLogs(context, { limit: limit || 10, format });

            default:
                // Treat as action type
                return await this.getActionAuditLogs(action, context, { limit, format });
        }
    },

    /**
     * Get audit logs with filters
     */
    async getAuditLogs(context, options = {}) {
        try {
            // Check permissions
            if (!context.message.member.permissions.has('VIEW_AUDIT_LOG')) {
                throw new Error('You do not have permission to view audit logs');
            }

            const { 
                action, 
                user, 
                target, 
                limit = 50, 
                before, 
                after, 
                format = 'array' 
            } = options;

            const guild = context.message.guild;
            const fetchOptions = { limit: Math.min(100, Math.max(1, limit)) };

            // Add filters
            if (action) {
                fetchOptions.type = this.getAuditLogType(action);
            }

            if (user) {
                fetchOptions.user = user;
            }

            if (before) {
                fetchOptions.before = before;
            }

            const auditLogs = await guild.fetchAuditLogs(fetchOptions);
            let entries = Array.from(auditLogs.entries.values());

            // Filter by target if specified
            if (target) {
                entries = entries.filter(entry => entry.target?.id === target);
            }

            // Filter by after timestamp
            if (after) {
                const afterDate = new Date(after);
                entries = entries.filter(entry => entry.createdAt > afterDate);
            }

            // Format results
            const formattedEntries = entries.map(entry => this.formatAuditEntry(entry));

            return this.formatOutput(formattedEntries, format);

        } catch (error) {
            throw new Error(`Failed to get audit logs: ${error.message}`);
        }
    },

    /**
     * Get audit logs for specific user
     */
    async getUserAuditLogs(userId, context, options = {}) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        return await this.getAuditLogs(context, { ...options, user: userId });
    },

    /**
     * Get audit logs for specific action type
     */
    async getActionAuditLogs(actionType, context, options = {}) {
        if (!actionType) {
            throw new Error('Action type is required');
        }

        return await this.getAuditLogs(context, { ...options, action: actionType });
    },

    /**
     * Get recent audit logs (last 10 by default)
     */
    async getRecentAuditLogs(context, options = {}) {
        return await this.getAuditLogs(context, { ...options, limit: options.limit || 10 });
    },

    /**
     * Format audit log entry
     */
    formatAuditEntry(entry) {
        return {
            id: entry.id,
            action: entry.action,
            actionType: entry.actionType,
            executor: entry.executor ? {
                id: entry.executor.id,
                tag: entry.executor.tag,
                username: entry.executor.username
            } : null,
            target: entry.target ? {
                id: entry.target.id,
                name: entry.target.name || entry.target.tag || entry.target.username || 'Unknown',
                type: entry.targetType
            } : null,
            reason: entry.reason || null,
            changes: entry.changes ? Array.from(entry.changes.values()).map(change => ({
                key: change.key,
                old: change.old,
                new: change.new
            })) : [],
            createdAt: entry.createdAt,
            timestamp: Math.floor(entry.createdTimestamp / 1000)
        };
    },

    /**
     * Get audit log type from action string
     */
    getAuditLogType(action) {
        const actionMap = {
            // Guild actions
            'GUILD_UPDATE': 1,
            'CHANNEL_CREATE': 10,
            'CHANNEL_UPDATE': 11,
            'CHANNEL_DELETE': 12,
            'CHANNEL_OVERWRITE_CREATE': 13,
            'CHANNEL_OVERWRITE_UPDATE': 14,
            'CHANNEL_OVERWRITE_DELETE': 15,
            
            // Member actions
            'MEMBER_KICK': 20,
            'MEMBER_PRUNE': 21,
            'MEMBER_BAN_ADD': 22,
            'MEMBER_BAN_REMOVE': 23,
            'MEMBER_UPDATE': 24,
            'MEMBER_ROLE_UPDATE': 25,
            'MEMBER_MOVE': 26,
            'MEMBER_DISCONNECT': 27,
            'BOT_ADD': 28,
            
            // Role actions
            'ROLE_CREATE': 30,
            'ROLE_UPDATE': 31,
            'ROLE_DELETE': 32,
            
            // Invite actions
            'INVITE_CREATE': 40,
            'INVITE_UPDATE': 41,
            'INVITE_DELETE': 42,
            
            // Webhook actions
            'WEBHOOK_CREATE': 50,
            'WEBHOOK_UPDATE': 51,
            'WEBHOOK_DELETE': 52,
            
            // Emoji actions
            'EMOJI_CREATE': 60,
            'EMOJI_UPDATE': 61,
            'EMOJI_DELETE': 62,
            
            // Message actions
            'MESSAGE_DELETE': 72,
            'MESSAGE_BULK_DELETE': 73,
            'MESSAGE_PIN': 74,
            'MESSAGE_UNPIN': 75,
            
            // Integration actions
            'INTEGRATION_CREATE': 80,
            'INTEGRATION_UPDATE': 81,
            'INTEGRATION_DELETE': 82,
            
            // Stage actions
            'STAGE_INSTANCE_CREATE': 83,
            'STAGE_INSTANCE_UPDATE': 84,
            'STAGE_INSTANCE_DELETE': 85,
            
            // Sticker actions
            'STICKER_CREATE': 90,
            'STICKER_UPDATE': 91,
            'STICKER_DELETE': 92,
            
            // Thread actions
            'THREAD_CREATE': 110,
            'THREAD_UPDATE': 111,
            'THREAD_DELETE': 112
        };

        const upperAction = action.toUpperCase();
        return actionMap[upperAction] || null;
    },

    /**
     * Format output based on requested format
     */
    formatOutput(entries, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(entries);
                
            case 'count':
                return entries.length;
                
            case 'recent':
                return entries.slice(0, 5);
                
            case 'summary':
                return entries.map(entry => ({
                    action: entry.action,
                    executor: entry.executor?.tag || 'Unknown',
                    target: entry.target?.name || 'Unknown',
                    timestamp: entry.timestamp
                }));
                
            case 'actions':
                return [...new Set(entries.map(entry => entry.action))];
                
            case 'executors':
                return [...new Set(entries.map(entry => entry.executor?.tag).filter(Boolean))];
                
            case 'array':
            default:
                return entries;
        }
    }
};
