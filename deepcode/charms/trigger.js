/**
 * Trigger charm - Conditional triggers and automation
 * Tier 3 primitive for advanced automation
 * 
 * Examples:
 * $trigger[create, { "name": "auto_role", "condition": "user_join", "action": "add_role" }] - Create trigger
 * $trigger[check, { "condition": "level >= 10", "data": {...} }] - Check condition
 * $trigger[list] - List all triggers
 */
module.exports = {
    name: 'trigger',
    description: 'Conditional triggers and automation system',
    tier: 3,

    // Static storage for triggers
    _triggers: new Map(),
    _triggerHistory: new Map(),

    async execute(args, context) {
        const { 
            action = 'create',
            name,
            condition,
            triggerAction,
            data,
            enabled = true,
            priority = 0
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
            case 'add':
                return this.createTrigger(name, args, context);

            case 'check':
            case 'test':
                return await this.checkTrigger(condition, data, context);

            case 'execute':
            case 'run':
                return await this.executeTrigger(name, data, context);

            case 'delete':
            case 'remove':
                return this.deleteTrigger(name);

            case 'enable':
                return this.enableTrigger(name);

            case 'disable':
                return this.disableTrigger(name);

            case 'list':
                return this.listTriggers();

            case 'get':
            case 'info':
                return this.getTrigger(name);

            case 'history':
                return this.getTriggerHistory(name);

            case 'clear':
                return this.clearTriggers(name);

            default:
                throw new Error(`Unknown trigger action: ${action}`);
        }
    },

    /**
     * Create trigger
     */
    createTrigger(triggerName, options, context) {
        if (!triggerName) {
            throw new Error('Trigger name is required');
        }

        const { 
            condition, 
            triggerAction, 
            data = {}, 
            enabled = true, 
            priority = 0,
            cooldown = 0,
            maxExecutions = -1
        } = options;

        if (!condition) {
            throw new Error('Trigger condition is required');
        }

        if (!triggerAction) {
            throw new Error('Trigger action is required');
        }

        const trigger = {
            name: triggerName,
            condition: condition,
            action: triggerAction,
            data: data,
            enabled: enabled,
            priority: priority,
            cooldown: cooldown * 1000, // Convert to milliseconds
            maxExecutions: maxExecutions,
            createdAt: Date.now(),
            lastExecuted: null,
            executionCount: 0,
            context: {
                guild: context.message?.guild?.id || null,
                channel: context.message?.channel?.id || null,
                user: context.message?.author?.id || null
            }
        };

        this._triggers.set(triggerName, trigger);

        return {
            success: true,
            trigger: {
                name: triggerName,
                condition: condition,
                action: triggerAction,
                enabled: enabled,
                priority: priority
            }
        };
    },

    /**
     * Check trigger condition
     */
    async checkTrigger(condition, data, context) {
        if (!condition) {
            throw new Error('Condition is required');
        }

        try {
            const result = await this.evaluateCondition(condition, data, context);
            
            return {
                success: true,
                condition: condition,
                result: result,
                data: data,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                condition: condition,
                error: error.message,
                data: data,
                timestamp: Date.now()
            };
        }
    },

    /**
     * Execute specific trigger
     */
    async executeTrigger(triggerName, data, context) {
        if (!triggerName) {
            throw new Error('Trigger name is required');
        }

        const trigger = this._triggers.get(triggerName);
        if (!trigger) {
            throw new Error('Trigger not found');
        }

        if (!trigger.enabled) {
            return {
                success: false,
                trigger: triggerName,
                reason: 'Trigger is disabled'
            };
        }

        // Check cooldown
        if (trigger.cooldown > 0 && trigger.lastExecuted) {
            const timeSinceLastExecution = Date.now() - trigger.lastExecuted;
            if (timeSinceLastExecution < trigger.cooldown) {
                return {
                    success: false,
                    trigger: triggerName,
                    reason: 'Trigger is on cooldown',
                    remainingCooldown: trigger.cooldown - timeSinceLastExecution
                };
            }
        }

        // Check max executions
        if (trigger.maxExecutions > 0 && trigger.executionCount >= trigger.maxExecutions) {
            return {
                success: false,
                trigger: triggerName,
                reason: 'Maximum executions reached'
            };
        }

        // Check condition
        const conditionMet = await this.evaluateCondition(trigger.condition, data, context);
        if (!conditionMet) {
            return {
                success: false,
                trigger: triggerName,
                reason: 'Condition not met',
                condition: trigger.condition
            };
        }

        // Execute action
        try {
            const actionResult = await this.executeAction(trigger.action, { ...trigger.data, ...data }, context);
            
            // Update trigger stats
            trigger.lastExecuted = Date.now();
            trigger.executionCount++;

            // Store in history
            this.addToHistory(triggerName, {
                timestamp: Date.now(),
                condition: trigger.condition,
                action: trigger.action,
                data: data,
                result: actionResult
            });

            return {
                success: true,
                trigger: triggerName,
                executed: true,
                result: actionResult,
                executionCount: trigger.executionCount
            };
        } catch (error) {
            return {
                success: false,
                trigger: triggerName,
                error: error.message,
                executionCount: trigger.executionCount
            };
        }
    },

    /**
     * Delete trigger
     */
    deleteTrigger(triggerName) {
        if (!triggerName) {
            throw new Error('Trigger name is required');
        }

        const trigger = this._triggers.get(triggerName);
        if (!trigger) {
            throw new Error('Trigger not found');
        }

        this._triggers.delete(triggerName);
        this._triggerHistory.delete(triggerName);

        return {
            success: true,
            deleted: triggerName,
            executionCount: trigger.executionCount
        };
    },

    /**
     * Enable trigger
     */
    enableTrigger(triggerName) {
        const trigger = this._triggers.get(triggerName);
        if (!trigger) {
            throw new Error('Trigger not found');
        }

        trigger.enabled = true;
        return { success: true, enabled: triggerName };
    },

    /**
     * Disable trigger
     */
    disableTrigger(triggerName) {
        const trigger = this._triggers.get(triggerName);
        if (!trigger) {
            throw new Error('Trigger not found');
        }

        trigger.enabled = false;
        return { success: true, disabled: triggerName };
    },

    /**
     * List all triggers
     */
    listTriggers() {
        const triggers = Array.from(this._triggers.values()).map(trigger => ({
            name: trigger.name,
            condition: trigger.condition,
            action: trigger.action,
            enabled: trigger.enabled,
            priority: trigger.priority,
            executionCount: trigger.executionCount,
            lastExecuted: trigger.lastExecuted,
            createdAt: trigger.createdAt
        }));

        return triggers.sort((a, b) => b.priority - a.priority);
    },

    /**
     * Get specific trigger
     */
    getTrigger(triggerName) {
        if (!triggerName) {
            throw new Error('Trigger name is required');
        }

        const trigger = this._triggers.get(triggerName);
        if (!trigger) {
            throw new Error('Trigger not found');
        }

        return trigger;
    },

    /**
     * Get trigger history
     */
    getTriggerHistory(triggerName) {
        if (triggerName) {
            return this._triggerHistory.get(triggerName) || [];
        }

        // Get all trigger history
        const allHistory = [];
        for (const [trigger, history] of this._triggerHistory.entries()) {
            allHistory.push(...history.map(h => ({ ...h, trigger })));
        }

        return allHistory.sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Clear triggers
     */
    clearTriggers(triggerName) {
        if (triggerName) {
            const trigger = this._triggers.get(triggerName);
            if (!trigger) {
                throw new Error('Trigger not found');
            }

            this._triggers.delete(triggerName);
            this._triggerHistory.delete(triggerName);

            return {
                success: true,
                cleared: triggerName,
                executionCount: trigger.executionCount
            };
        }

        // Clear all triggers
        const count = this._triggers.size;
        this._triggers.clear();
        this._triggerHistory.clear();

        return {
            success: true,
            cleared: count
        };
    },

    /**
     * Evaluate condition
     */
    async evaluateCondition(condition, data, context) {
        if (typeof condition === 'boolean') {
            return condition;
        }

        if (typeof condition === 'string') {
            // Simple string conditions
            if (condition === 'true') return true;
            if (condition === 'false') return false;
            
            // Variable conditions
            if (condition.startsWith('$')) {
                const varName = condition.slice(1);
                return data[varName] !== undefined;
            }

            // Expression evaluation (simplified)
            return this.evaluateExpression(condition, data);
        }

        if (typeof condition === 'object') {
            // Object-based conditions
            const { operator, left, right, value } = condition;

            if (operator && left !== undefined && right !== undefined) {
                return this.evaluateComparison(operator, left, right, data);
            }

            if (value !== undefined) {
                return Boolean(value);
            }
        }

        if (typeof condition === 'function') {
            return await condition(data, context);
        }

        return false;
    },

    /**
     * Evaluate expression (simplified)
     */
    evaluateExpression(expression, data) {
        // This is a very simplified expression evaluator
        // In a real implementation, you'd use a proper expression parser
        
        // Replace variables
        let expr = expression;
        for (const [key, value] of Object.entries(data)) {
            expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
        }

        // Simple comparisons
        if (expr.includes('>=')) {
            const [left, right] = expr.split('>=').map(s => s.trim());
            return parseFloat(left) >= parseFloat(right);
        }
        if (expr.includes('<=')) {
            const [left, right] = expr.split('<=').map(s => s.trim());
            return parseFloat(left) <= parseFloat(right);
        }
        if (expr.includes('>')) {
            const [left, right] = expr.split('>').map(s => s.trim());
            return parseFloat(left) > parseFloat(right);
        }
        if (expr.includes('<')) {
            const [left, right] = expr.split('<').map(s => s.trim());
            return parseFloat(left) < parseFloat(right);
        }
        if (expr.includes('==')) {
            const [left, right] = expr.split('==').map(s => s.trim());
            return left === right;
        }
        if (expr.includes('!=')) {
            const [left, right] = expr.split('!=').map(s => s.trim());
            return left !== right;
        }

        return Boolean(expr);
    },

    /**
     * Evaluate comparison
     */
    evaluateComparison(operator, left, right, data) {
        // Resolve variables
        const leftValue = typeof left === 'string' && data[left] !== undefined ? data[left] : left;
        const rightValue = typeof right === 'string' && data[right] !== undefined ? data[right] : right;

        switch (operator) {
            case '==': return leftValue == rightValue;
            case '===': return leftValue === rightValue;
            case '!=': return leftValue != rightValue;
            case '!==': return leftValue !== rightValue;
            case '>': return leftValue > rightValue;
            case '>=': return leftValue >= rightValue;
            case '<': return leftValue < rightValue;
            case '<=': return leftValue <= rightValue;
            case 'includes': return String(leftValue).includes(String(rightValue));
            case 'startsWith': return String(leftValue).startsWith(String(rightValue));
            case 'endsWith': return String(leftValue).endsWith(String(rightValue));
            default: return false;
        }
    },

    /**
     * Execute action
     */
    async executeAction(action, data, context) {
        // This is a simplified action executor
        // In a real implementation, this would integrate with the command/charm system
        
        return {
            action: action,
            data: data,
            executed: true,
            timestamp: Date.now()
        };
    },

    /**
     * Add to trigger history
     */
    addToHistory(triggerName, historyEntry) {
        if (!this._triggerHistory.has(triggerName)) {
            this._triggerHistory.set(triggerName, []);
        }

        const history = this._triggerHistory.get(triggerName);
        history.push(historyEntry);

        // Keep only last 50 entries per trigger
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
    }
};
