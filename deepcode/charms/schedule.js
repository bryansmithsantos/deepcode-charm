/**
 * Schedule charm - Task scheduling and cron-like functionality
 * Tier 3 primitive for advanced scheduling
 * 
 * Examples:
 * $schedule[create, { "name": "daily_backup", "cron": "0 0 * * *", "command": "backup" }] - Daily task
 * $schedule[once, { "delay": "1h", "command": "remind_user" }] - One-time task
 * $schedule[list] - List all scheduled tasks
 */
module.exports = {
    name: 'schedule',
    description: 'Task scheduling and cron-like functionality',
    tier: 3,

    // Static storage for scheduled tasks
    _tasks: new Map(),
    _timers: new Map(),
    _intervals: new Map(),

    async execute(args, context) {
        const { 
            action = 'create',
            name,
            cron,
            delay,
            interval,
            command,
            data,
            enabled = true
        } = args;

        switch (action.toLowerCase()) {
            case 'create':
            case 'add':
                return this.createTask(name, args, context);

            case 'once':
            case 'timeout':
                return this.scheduleOnce(delay, command, context, data);

            case 'repeat':
            case 'interval':
                return this.scheduleRepeat(interval, command, context, data, name);

            case 'cron':
                return this.scheduleCron(cron, command, context, data, name);

            case 'delete':
            case 'remove':
                return this.deleteTask(name);

            case 'enable':
                return this.enableTask(name);

            case 'disable':
                return this.disableTask(name);

            case 'list':
                return this.listTasks();

            case 'get':
            case 'info':
                return this.getTask(name);

            case 'clear':
                return this.clearAllTasks();

            default:
                throw new Error(`Unknown schedule action: ${action}`);
        }
    },

    /**
     * Create a scheduled task
     */
    createTask(taskName, options, context) {
        if (!taskName) {
            throw new Error('Task name is required');
        }

        const { cron, delay, interval, command, data, enabled = true } = options;

        if (!command) {
            throw new Error('Command is required for scheduled task');
        }

        // Determine task type
        let taskType;
        let schedule;

        if (cron) {
            taskType = 'cron';
            schedule = cron;
        } else if (interval) {
            taskType = 'interval';
            schedule = interval;
        } else if (delay) {
            taskType = 'once';
            schedule = delay;
        } else {
            throw new Error('Must specify cron, interval, or delay');
        }

        const task = {
            name: taskName,
            type: taskType,
            schedule: schedule,
            command: command,
            data: data || {},
            enabled: enabled,
            createdAt: Date.now(),
            lastRun: null,
            nextRun: null,
            runCount: 0,
            context: {
                guild: context.message?.guild?.id || null,
                channel: context.message?.channel?.id || null,
                user: context.message?.author?.id || null
            }
        };

        // Store task
        this._tasks.set(taskName, task);

        // Schedule the task if enabled
        if (enabled) {
            this.scheduleTask(task, context);
        }

        return {
            success: true,
            task: {
                name: taskName,
                type: taskType,
                schedule: schedule,
                enabled: enabled,
                nextRun: task.nextRun
            }
        };
    },

    /**
     * Schedule one-time task
     */
    scheduleOnce(delay, command, context, data) {
        if (!delay || !command) {
            throw new Error('Delay and command are required');
        }

        const delayMs = this.parseDuration(delay);
        const taskName = `once_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const timer = setTimeout(() => {
            this.executeTask(command, data, context);
            this._tasks.delete(taskName);
            this._timers.delete(taskName);
        }, delayMs);

        this._timers.set(taskName, timer);

        const task = {
            name: taskName,
            type: 'once',
            schedule: delay,
            command: command,
            data: data || {},
            enabled: true,
            createdAt: Date.now(),
            nextRun: Date.now() + delayMs,
            runCount: 0
        };

        this._tasks.set(taskName, task);

        return {
            success: true,
            task: {
                name: taskName,
                type: 'once',
                delay: delay,
                nextRun: task.nextRun
            }
        };
    },

    /**
     * Schedule repeating task
     */
    scheduleRepeat(intervalStr, command, context, data, taskName) {
        if (!intervalStr || !command) {
            throw new Error('Interval and command are required');
        }

        const intervalMs = this.parseDuration(intervalStr);
        const name = taskName || `repeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const interval = setInterval(() => {
            const task = this._tasks.get(name);
            if (task && task.enabled) {
                this.executeTask(command, data, context);
                task.lastRun = Date.now();
                task.nextRun = Date.now() + intervalMs;
                task.runCount++;
            }
        }, intervalMs);

        this._intervals.set(name, interval);

        const task = {
            name: name,
            type: 'interval',
            schedule: intervalStr,
            command: command,
            data: data || {},
            enabled: true,
            createdAt: Date.now(),
            lastRun: null,
            nextRun: Date.now() + intervalMs,
            runCount: 0
        };

        this._tasks.set(name, task);

        return {
            success: true,
            task: {
                name: name,
                type: 'interval',
                interval: intervalStr,
                nextRun: task.nextRun
            }
        };
    },

    /**
     * Schedule cron task (simplified cron)
     */
    scheduleCron(cronExpression, command, context, data, taskName) {
        if (!cronExpression || !command) {
            throw new Error('Cron expression and command are required');
        }

        const name = taskName || `cron_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nextRun = this.getNextCronRun(cronExpression);

        const task = {
            name: name,
            type: 'cron',
            schedule: cronExpression,
            command: command,
            data: data || {},
            enabled: true,
            createdAt: Date.now(),
            lastRun: null,
            nextRun: nextRun,
            runCount: 0
        };

        this._tasks.set(name, task);
        this.scheduleCronTask(task, context);

        return {
            success: true,
            task: {
                name: name,
                type: 'cron',
                cron: cronExpression,
                nextRun: nextRun
            }
        };
    },

    /**
     * Delete scheduled task
     */
    deleteTask(taskName) {
        if (!taskName) {
            throw new Error('Task name is required');
        }

        const task = this._tasks.get(taskName);
        if (!task) {
            throw new Error('Task not found');
        }

        // Clear timers/intervals
        if (this._timers.has(taskName)) {
            clearTimeout(this._timers.get(taskName));
            this._timers.delete(taskName);
        }

        if (this._intervals.has(taskName)) {
            clearInterval(this._intervals.get(taskName));
            this._intervals.delete(taskName);
        }

        this._tasks.delete(taskName);

        return {
            success: true,
            deleted: taskName,
            type: task.type
        };
    },

    /**
     * Enable task
     */
    enableTask(taskName) {
        const task = this._tasks.get(taskName);
        if (!task) {
            throw new Error('Task not found');
        }

        task.enabled = true;
        return { success: true, enabled: taskName };
    },

    /**
     * Disable task
     */
    disableTask(taskName) {
        const task = this._tasks.get(taskName);
        if (!task) {
            throw new Error('Task not found');
        }

        task.enabled = false;
        return { success: true, disabled: taskName };
    },

    /**
     * List all tasks
     */
    listTasks() {
        const tasks = Array.from(this._tasks.values()).map(task => ({
            name: task.name,
            type: task.type,
            schedule: task.schedule,
            command: task.command,
            enabled: task.enabled,
            createdAt: task.createdAt,
            lastRun: task.lastRun,
            nextRun: task.nextRun,
            runCount: task.runCount
        }));

        return tasks;
    },

    /**
     * Get specific task
     */
    getTask(taskName) {
        if (!taskName) {
            throw new Error('Task name is required');
        }

        const task = this._tasks.get(taskName);
        if (!task) {
            throw new Error('Task not found');
        }

        return task;
    },

    /**
     * Clear all tasks
     */
    clearAllTasks() {
        const count = this._tasks.size;

        // Clear all timers and intervals
        for (const timer of this._timers.values()) {
            clearTimeout(timer);
        }
        for (const interval of this._intervals.values()) {
            clearInterval(interval);
        }

        this._tasks.clear();
        this._timers.clear();
        this._intervals.clear();

        return {
            success: true,
            cleared: count
        };
    },

    /**
     * Schedule a task based on its type
     */
    scheduleTask(task, context) {
        switch (task.type) {
            case 'once':
                const delay = this.parseDuration(task.schedule);
                const timer = setTimeout(() => {
                    this.executeTask(task.command, task.data, context);
                    this._tasks.delete(task.name);
                    this._timers.delete(task.name);
                }, delay);
                this._timers.set(task.name, timer);
                break;

            case 'interval':
                const intervalMs = this.parseDuration(task.schedule);
                const interval = setInterval(() => {
                    if (task.enabled) {
                        this.executeTask(task.command, task.data, context);
                        task.lastRun = Date.now();
                        task.nextRun = Date.now() + intervalMs;
                        task.runCount++;
                    }
                }, intervalMs);
                this._intervals.set(task.name, interval);
                break;

            case 'cron':
                this.scheduleCronTask(task, context);
                break;
        }
    },

    /**
     * Schedule cron task
     */
    scheduleCronTask(task, context) {
        const nextRun = this.getNextCronRun(task.schedule);
        const delay = nextRun - Date.now();

        if (delay > 0) {
            const timer = setTimeout(() => {
                if (task.enabled) {
                    this.executeTask(task.command, task.data, context);
                    task.lastRun = Date.now();
                    task.runCount++;
                }
                // Schedule next run
                this.scheduleCronTask(task, context);
            }, delay);

            this._timers.set(task.name, timer);
            task.nextRun = nextRun;
        }
    },

    /**
     * Execute scheduled task
     */
    async executeTask(command, data, context) {
        try {
            // This is a simplified task execution
            // In a real implementation, this would integrate with the command system
            console.log(`Executing scheduled task: ${command}`, data);
            
            // You could integrate with the charm system here
            // For example: await context.client.executeCharm(command, data, context);
            
        } catch (error) {
            console.error('Error executing scheduled task:', error);
        }
    },

    /**
     * Parse duration string to milliseconds
     */
    parseDuration(duration) {
        const match = duration.toString().match(/^(\d+)(ms|s|m|h|d)?$/i);
        if (!match) {
            throw new Error(`Invalid duration format: ${duration}`);
        }

        const [, amount, unit] = match;
        const num = parseInt(amount);

        switch ((unit || 's').toLowerCase()) {
            case 'ms': return num;
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: return num * 1000;
        }
    },

    /**
     * Get next cron run time (simplified cron parser)
     */
    getNextCronRun(cronExpression) {
        // Simplified cron: "minute hour day month dayOfWeek"
        // For now, just add 1 hour as placeholder
        // In a real implementation, you'd use a proper cron parser
        return Date.now() + (60 * 60 * 1000);
    }
};
