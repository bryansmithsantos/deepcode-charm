/**
 * File charm - File operations and attachments
 * Tier 2 primitive for file handling
 * 
 * Examples:
 * $file[read, "data.txt"] - Read file content
 * $file[write, { "path": "data.txt", "content": "Hello" }] - Write file
 * $file[attach, "image.png"] - Attach file to message
 */
module.exports = {
    name: 'file',
    description: 'File operations and attachment handling',
    tier: 2,

    async execute(args, context) {
        // Handle simple format: $file[filename]
        if (typeof args === 'string') {
            return await this.readFile(args);
        }

        const { 
            action = 'read', 
            path, 
            content, 
            encoding = 'utf8',
            url,
            name,
            description
        } = args;

        switch (action.toLowerCase()) {
            case 'read':
                return await this.readFile(path, encoding);

            case 'write':
                return await this.writeFile(path, content, encoding);

            case 'append':
                return await this.appendFile(path, content, encoding);

            case 'delete':
            case 'remove':
                return await this.deleteFile(path);

            case 'exists':
                return await this.fileExists(path);

            case 'size':
                return await this.getFileSize(path);

            case 'info':
                return await this.getFileInfo(path);

            case 'attach':
                return await this.createAttachment(path, name, description);

            case 'download':
                return await this.downloadFile(url, path);

            case 'list':
                return await this.listFiles(path || '.');

            default:
                throw new Error(`Unknown file action: ${action}`);
        }
    },

    /**
     * Read file content
     */
    async readFile(filePath, encoding = 'utf8') {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            const content = await fs.readFile(safePath, encoding);
            return content;

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to read file: ${error.message}`);
        }
    },

    /**
     * Write file content
     */
    async writeFile(filePath, content, encoding = 'utf8') {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(safePath), { recursive: true });
            
            await fs.writeFile(safePath, content, encoding);
            
            return {
                success: true,
                path: safePath,
                size: Buffer.byteLength(content, encoding)
            };

        } catch (error) {
            throw new Error(`Failed to write file: ${error.message}`);
        }
    },

    /**
     * Append to file
     */
    async appendFile(filePath, content, encoding = 'utf8') {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(safePath), { recursive: true });
            
            await fs.appendFile(safePath, content, encoding);
            
            const stats = await fs.stat(safePath);
            
            return {
                success: true,
                path: safePath,
                size: stats.size
            };

        } catch (error) {
            throw new Error(`Failed to append to file: ${error.message}`);
        }
    },

    /**
     * Delete file
     */
    async deleteFile(filePath) {
        try {
            const fs = require('fs').promises;
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            await fs.unlink(safePath);
            
            return {
                success: true,
                deletedFile: safePath
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    },

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            const fs = require('fs').promises;
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            await fs.access(safePath);
            return true;

        } catch {
            return false;
        }
    },

    /**
     * Get file size
     */
    async getFileSize(filePath) {
        try {
            const fs = require('fs').promises;
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            const stats = await fs.stat(safePath);
            return stats.size;

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to get file size: ${error.message}`);
        }
    },

    /**
     * Get file info
     */
    async getFileInfo(filePath) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            const stats = await fs.stat(safePath);
            
            return {
                path: safePath,
                name: path.basename(safePath),
                extension: path.extname(safePath),
                size: stats.size,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                accessedAt: stats.atime
            };

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    },

    /**
     * Create attachment for Discord message
     */
    async createAttachment(filePath, name, description) {
        try {
            const { AttachmentBuilder } = require('discord.js');
            const path = require('path');
            
            // Validate path for security
            const safePath = this.validatePath(filePath);
            
            const attachment = new AttachmentBuilder(safePath, {
                name: name || path.basename(safePath),
                description: description || undefined
            });
            
            return attachment;

        } catch (error) {
            throw new Error(`Failed to create attachment: ${error.message}`);
        }
    },

    /**
     * Download file from URL
     */
    async downloadFile(url, savePath) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const https = require('https');
            const http = require('http');
            
            if (!url || !savePath) {
                throw new Error('URL and save path are required');
            }
            
            // Validate path for security
            const safePath = this.validatePath(savePath);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(safePath), { recursive: true });
            
            return new Promise((resolve, reject) => {
                const client = url.startsWith('https:') ? https : http;
                
                client.get(url, (response) => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                        return;
                    }
                    
                    const fileStream = require('fs').createWriteStream(safePath);
                    response.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve({
                            success: true,
                            path: safePath,
                            url: url,
                            size: response.headers['content-length'] || 'unknown'
                        });
                    });
                    
                    fileStream.on('error', (error) => {
                        reject(new Error(`Failed to save file: ${error.message}`));
                    });
                    
                }).on('error', (error) => {
                    reject(new Error(`Failed to download file: ${error.message}`));
                });
            });

        } catch (error) {
            throw new Error(`Failed to download file: ${error.message}`);
        }
    },

    /**
     * List files in directory
     */
    async listFiles(dirPath = '.') {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Validate path for security
            const safePath = this.validatePath(dirPath);
            
            const files = await fs.readdir(safePath, { withFileTypes: true });
            
            const fileList = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(safePath, file.name);
                    const stats = await fs.stat(filePath);
                    
                    return {
                        name: file.name,
                        path: filePath,
                        isFile: file.isFile(),
                        isDirectory: file.isDirectory(),
                        size: stats.size,
                        modifiedAt: stats.mtime
                    };
                })
            );
            
            return fileList;

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Directory not found: ${dirPath}`);
            }
            throw new Error(`Failed to list files: ${error.message}`);
        }
    },

    /**
     * Validate file path for security
     */
    validatePath(filePath) {
        const path = require('path');
        
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path');
        }
        
        // Prevent directory traversal attacks
        if (filePath.includes('..') || filePath.includes('~')) {
            throw new Error('Invalid file path: directory traversal not allowed');
        }
        
        // Resolve to absolute path within project directory
        const projectRoot = process.cwd();
        const dataDir = path.join(projectRoot, 'data');
        const safePath = path.resolve(dataDir, filePath);
        
        // Ensure the resolved path is within the data directory
        if (!safePath.startsWith(dataDir)) {
            throw new Error('Invalid file path: outside allowed directory');
        }
        
        return safePath;
    }
};
