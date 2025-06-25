/**
 * Economy Plugin Example - Advanced plugin with charm usage
 */
module.exports = {
    name: 'economy',
    description: 'Server economy system',
    version: '1.0.0',

    // Default configuration
    defaultConfig: {
        currency: {
            name: 'coins',
            symbol: '🪙',
            startBalance: 100,
            dailyAmount: 50,
            maxBalance: 1000000
        },
        rewards: {
            message: 1,
            command: 2,
            voice: 5,
            reaction: 1
        },
        shop: {
            enabled: true,
            items: [
                {
                    id: 'role1',
                    name: 'VIP Role',
                    price: 1000,
                    type: 'role',
                    data: 'VIP_ROLE_ID'
                }
            ]
        },
        gambling: {
            enabled: true,
            minBet: 10,
            maxBet: 1000,
            houseEdge: 0.05
        }
    },

    // Plugin data storage
    data: {
        accounts: new Map(),
        transactions: new Map(),
        cooldowns: new Map()
    },

    /**
     * Initialize plugin
     */
    async init(client) {
        // Get or create config
        this.config = await client.variables.get('plugins.economy') || 
            this.defaultConfig;

        // Register commands
        client.commands.register({
            name: 'balance',
            description: 'Check your balance',
            code: '$embed[{' +
                '"title": "Balance",' +
                '"description": "$$economy.getBalance $$symbol",' +
                '"footer": {' +
                    '"text": "Daily reward available in: $$economy.dailyTime"' +
                '}' +
            '}]'
        });

        client.commands.register({
            name: 'daily',
            description: 'Claim daily reward',
            cooldown: 86400,
            code: '$condition[{' +
                '"left": "$$economy.canDaily",' +
                '"operator": "equals",' +
                '"right": true,' +
                '"then": "$sequence[{' +
                    '"actions": [' +
                        '"$$economy.addDaily",' +
                        '$embed[{' +
                            '"title": "Daily Reward",' +
                            '"description": "You received $$dailyAmount $$symbol!",' +
                            '"color": "GREEN"' +
                        '}]' +
                    ']' +
                '}",' +
                '"else": "$embed[{' +
                    '"title": "Daily Reward",' +
                    '"description": "Next reward in: $$economy.dailyTime",' +
                    '"color": "RED"' +
                '}]"' +
            '}]'
        });

        client.commands.register({
            name: 'transfer',
            description: 'Transfer money to user',
            usage: '<@user> <amount>',
            code: '$condition[{' +
                '"left": "$$mentions[0]",' +
                '"operator": "exists",' +
                '"then": "$condition[{' +
                    '"left": "$$economy.canTransfer",' +
                    '"operator": "equals",' +
                    '"right": true,' +
                    '"then": "$sequence[{' +
                        '"actions": [' +
                            '"$$economy.transfer",' +
                            '$embed[{' +
                                '"title": "Transfer Complete",' +
                                '"description": "Sent $$args[1] $$symbol to $$mentions[0]",' +
                                '"color": "GREEN"' +
                            '}]' +
                        ']' +
                    '}",' +
                    '"else": "$say[Insufficient funds!]"' +
                '}",' +
                '"else": "$say[Please mention a user]"' +
            '}]'
        });

        client.commands.register({
            name: 'shop',
            description: 'View or buy from shop',
            usage: '[buy] [item]',
            code: '$condition[{' +
                '"left": "$$args[0]",' +
                '"operator": "equals",' +
                '"right": "buy",' +
                '"then": "$$economy.buyItem",' +
                '"else": "$embed[{' +
                    '"title": "Shop",' +
                    '"description": "Available items:\\n\\n$$economy.shopList",' +
                    '"footer": {' +
                        '"text": "Use $$prefix shop buy <item> to purchase"' +
                    '}' +
                '}]"' +
            '}]'
        });

        // Register event handlers
        client.events.on('messageCreate', message => this.handleMessage(message));
        client.events.on('voiceStateUpdate', (old, current) => this.handleVoice(old, current));
    },

    /**
     * Handle message rewards
     */
    async handleMessage(message) {
        if (message.author.bot) return;
        if (!this.config.rewards.message) return;

        await this.addBalance(
            message.author.id,
            this.config.rewards.message,
            'message'
        );
    },

    /**
     * Handle voice rewards
     */
    async handleVoice(oldState, newState) {
        if (!this.config.rewards.voice) return;
        if (oldState.channelId === newState.channelId) return;

        if (newState.channelId) {
            // User joined voice
            this.data.voiceTime.set(newState.member.id, Date.now());
        } else if (oldState.channelId) {
            // User left voice
            const joinTime = this.data.voiceTime.get(oldState.member.id);
            if (!joinTime) return;

            const duration = Date.now() - joinTime;
            const minutes = Math.floor(duration / 60000);
            const reward = minutes * this.config.rewards.voice;

            if (reward > 0) {
                await this.addBalance(
                    oldState.member.id,
                    reward,
                    'voice'
                );
            }

            this.data.voiceTime.delete(oldState.member.id);
        }
    },

    /**
     * Get user balance
     */
    async getBalance(userId) {
        const account = await this.client.variables.get(`economy.accounts.${userId}`);
        return account?.balance || 0;
    },

    /**
     * Add to user balance
     */
    async addBalance(userId, amount, reason) {
        const current = await this.getBalance(userId);
        const newAmount = Math.min(
            current + amount,
            this.config.currency.maxBalance
        );

        await this.client.variables.set(`economy.accounts.${userId}`, {
            balance: newAmount,
            lastDaily: this.data.accounts.get(userId)?.lastDaily
        });

        // Record transaction
        await this.logTransaction(userId, amount, reason);

        return newAmount;
    },

    /**
     * Log transaction
     */
    async logTransaction(userId, amount, reason) {
        const transaction = {
            userId,
            amount,
            reason,
            timestamp: Date.now()
        };

        const transactions = await this.client.variables.get('economy.transactions') || [];
        transactions.push(transaction);

        await this.client.variables.set('economy.transactions', transactions);
    },

    // Add more methods for handling shop, gambling, etc...
};
