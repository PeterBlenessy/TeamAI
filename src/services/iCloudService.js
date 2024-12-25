import { join } from '@tauri-apps/api/path';
import { homeDir } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { readFile, create, readDir, mkdir, remove } from '@tauri-apps/plugin-fs';
import logger from './logger';

const iCloudService = {
    // Internal state
    _isAvailable: false,
    _container: null,
    _initialized: false,

    /**
     * Initialize iCloud service and check availability
     */
    async init() {
        try {
            if (this._isMacOS()) {
                const home = await homeDir();
                const iCloudPath = await join(home, 'Library', 'Mobile Documents');
                const iCloudDocsPath = await join(iCloudPath, 'com~apple~CloudDocs');
                this._container = await join(iCloudDocsPath, 'TeamAI');


                // Create main and messages directories
                try {
                    await mkdir(this._container, { recursive: true });
                    logger.info(`[iCloudService] - Directories created or already exist`);
                } catch (dirError) {
                    logger.error(`[iCloudService] - Error creating directories: ${dirError}`);
                    throw dirError;
                }

                this._isAvailable = true;
                this._initialized = true;
                logger.info('[iCloudService] - Initialized successfully');
            } else {
                logger.warn('[iCloudService] - iCloud is only supported on macOS');
                this._isAvailable = false;
            }
        } catch (error) {
            logger.error(`[iCloudService] - Initialization failed: ${error}`);
            this._isAvailable = false;
        }
    },

    /**
     * Check if running on macOS
     */
    _isMacOS() {
        const platformName = platform();
        logger.info(`[iCloudService] - Current platform name: ${platformName}`);
        return platformName === 'macos';
    },

    /**
     * Ensure service is initialized
     */
    async _ensureInitialized() {
        if (!this._initialized) {
            await this.init();
        }
    },

    /**
     * Check if iCloud service is available
     */
    isAvailable() {
        return this._isAvailable;
    },

    /**
     * Save data to iCloud
     * @param {string} fileName - Name of file to save
     * @param {any} data - Data to store
     */
    async saveFile(fileName, data) {
        await this._ensureInitialized();
        if (!this._isAvailable) {
            throw new Error('iCloud is not available');
        }

        // Use the main container for all files, including conversations
        const filePath = await join(this._container, fileName); // Save directly in the TeamAI folder
        try {
            const file = await create(filePath);
            const contents = JSON.stringify(data, null, 2);
            
            // logger.info(`[iCloudService] - Writing contents to ${filePath}: ${contents}`);
            await file.write(new TextEncoder().encode(contents));
            await file.close();
            logger.info(`[iCloudService] - Saved file: ${fileName}`);
            return true;
        } catch (error) {
            logger.error(`[iCloudService] - Error saving file ${fileName}: ${error}`);
            throw error;
        }
    },

    /**
     * Load data from iCloud
     * @param {string} fileName - Name of file to load
     */
    async readFile(fileName) {
        await this._ensureInitialized();
        if (!this._isAvailable) {
            throw new Error('iCloud is not available');
        }

        const filePath = await join(this._container, fileName);
        try {
            const contents = await readFile(filePath);
            const text = new TextDecoder().decode(contents);
            logger.info(`[iCloudService] - Read file contents from: ${fileName}`);
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                logger.error(`[iCloudService] - JSON parse error: ${parseError}`);
                logger.error(`[iCloudService] - Raw content: ${text}`);
                throw new Error(`Failed to parse JSON: ${parseError.message}`);
            }
        } catch (error) {
            if (error.toString().includes('No such file or directory')) {
                return null;
            }
            logger.error(`[iCloudService] - Error reading file ${fileName}: ${error}`);
            throw error;
        }
    },

    /**
     * List files in iCloud container
     */
    async listFiles() {
        await this._ensureInitialized();
        if (!this._isAvailable) {
            throw new Error('iCloud is not available');
        }

        try {
            return await readDir(this._container);
        } catch (error) {
            logger.error(`[iCloudService] - Error listing files: ${error}`);
            throw error;
        }
    },

    /**
     * Sync application settings to iCloud
     * @param {Object} settings - Application settings to sync
     * @param {Object} syncOptions - What to sync
     */
    async syncSettings(settings, syncOptions) {
        await this.handleFileOperations('sync', 'settings', settings, null);
    },

    /**
     * Sync personas to iCloud
     * @param {Array} personas - Array of persona objects from teams store
     */
    async syncPersonas(personas) {
        await this.handleFileOperations('sync', 'personas', personas, null);
    },

    /**
     * Get the latest personas from iCloud
     */
    async getLatestPersonas() {
        return await this.handleFileOperations('getLatest', 'personas');
    },

    /**
     * Clean up old personas files
     */
    async cleanupOldPersonas(keepCount = 5) {
        await this.handleFileOperations('cleanupOld', 'personas', null, keepCount);
    },

    /**
     * Get the latest settings file from iCloud
     * @returns {Promise<{timestamp: string, settings: Object}|null>}
     */
    async getLatestSettings() {
        return await this.handleFileOperations('getLatest', 'settings');
    },

    /**
     * Clean up old settings files, keeping only the N most recent
     * @param {number} keepCount - Number of recent files to keep
     */
    async cleanupOldSettings(keepCount = 5) {
        await this.handleFileOperations('cleanupOld', 'settings', null, keepCount);
    },

    /**
     * Sync conversations to iCloud
     */
    async syncConversations(teamsStore) {
        const teamsState = JSON.parse(JSON.stringify(teamsStore.$state));
        await this.handleFileOperations('sync', 'conversations', teamsState.history, null);
    },

    /**
     * Get all conversations from iCloud
     */
    async getLatestConversations() {
        return await this.handleFileOperations('getLatest', 'conversations');
    },

    /**
     * Clean up old conversation files
     */
    async cleanupOldConversations(keepCount = 5) {
        await this.handleFileOperations('cleanupOld', 'conversations', null, keepCount);
    },

    async handleFileOperations(action, fileType, data = null, keepCount = 5) {
        await this._ensureInitialized();
        if (!this._isAvailable) {
            throw new Error('iCloud is not available');
        }

        const filePrefix = `teamai-${fileType}-`;
        const files = await this.listFiles();
        const filteredFiles = files.filter(f => f.name.startsWith(filePrefix) && f.name.endsWith('.json'));

        switch (action) {
            case 'getLatest':
                filteredFiles.sort((a, b) => b.name.localeCompare(a.name)); // Sort descending
                if (filteredFiles.length === 0) {
                    return null;
                }
                return await this.readFile(filteredFiles[0].name);

            case 'cleanupOld':
                filteredFiles.sort((a, b) => b.name.localeCompare(a.name)); // Sort descending
                if (filteredFiles.length <= keepCount) {
                    return;
                }
                const filesToDelete = filteredFiles.slice(keepCount);
                for (const file of filesToDelete) {
                    await remove(await join(this._container, file.name));
                    logger.info(`[iCloudService] - Deleted old ${fileType} file: ${file.name}`);
                }
                break;

            case 'sync':
                const timestamp = new Date().toISOString().split('T')[0];
                const fileName = `${filePrefix}${timestamp}.json`;
                await this.saveFile(fileName, {
                    timestamp: new Date().toISOString(),
                    [fileType]: data // Use the fileType to set the correct property
                }, false);
                logger.info(`[iCloudService] - All ${fileType} synced to: ${fileName}`);
                return { success: true };

            default:
                throw new Error('Invalid action specified');
        }
    }
};

// Initialize the service when imported
iCloudService.init();

export default iCloudService; 