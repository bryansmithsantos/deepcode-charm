const { Message, Collection } = require('discord.js');

/**
 * Command execution context
 */
class CharmContext {
    constructor(client, message, command, args = []) {
        this.client = client;
        this.message = message;
        this.command = command;
        this.args = args;
        
        // Initialize context properties
        this.init();
    }

    /**
     * Initialize context properties 
     */
    init() {
        // Message properties
        this.author = this.message.author;
        this.channel = this.message.channel;
        this.guild = this.message.guild;
        this.member = this.message.member;

        // Command info
        this.prefix = this.client.prefix;
        this.commandName = this.command.name;

        // Response tracking
        this.responses = new Collection();
        this.executionTime = Date.now();
    }

    /**
     * Get context data
     */
    getData() {
        return {
            // User info
            user: this.author.tag,
            userId: this.author.id,

            // Channel info
            channel: this.channel.name,
            channelId: this.channel.id,
            
            // Guild info
            guild: this.guild?.name,
            guildId: this.guild?.id,

            // Command info
            command: this.commandName,
            prefix: this.prefix,
            args: this.args,

            // Timing
            timestamp: this.executionTime,
            latency: this.client.ws.ping
        };
    }

    /**
     * Send a message response
     */
    async send(content, options = {}) {
        try {
            const response = await this.channel.send(content, options);
            this.responses.set(response.id, response);
            return response;
        } catch (error) {
            console.error('Error sending response:', error);
            throw error;
        }
    }

    /**
     * Edit a previous response
     */
    async edit(messageId, content, options = {}) {
        try {
            const message = this.responses.get(messageId);
            if (!message) return null;

            const edited = await message.edit(content, options);
            return edited;
        } catch (error) {
            console.error('Error editing response:', error);
            throw error;
        }
    }

    /**
     * Delete a previous response
     */
    async delete(messageId) {
        try {
            const message = this.responses.get(messageId);
            if (!message) return false;

            await message.delete();
            this.responses.delete(messageId);
            return true;
        } catch (error) {
            console.error('Error deleting response:', error);
            throw error;
        }
    }

    /**
     * Reply to the command message
     */
    async reply(content, options = {}) {
        try {
            const response = await this.message.reply(content, options);
            this.responses.set(response.id, response);
            return response;
        } catch (error) {
            console.error('Error sending reply:', error);
            throw error;
        }
    }

    /**
     * React to the command message
     */
    async react(emoji) {
        try {
            const reaction = await this.message.react(emoji);
            return reaction;
        } catch (error) {
            console.error('Error adding reaction:', error);
            throw error;
        }
    }

    /**
     * Defer the response
     */
    async defer(ephemeral = false) {
        if (this.message.deferReply) {
            await this.message.deferReply({ ephemeral });
        }
    }
}

module.exports = CharmContext;
