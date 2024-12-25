import { join } from '@tauri-apps/api/path';
import { homeDir } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { readFile, create, readDir, mkdir, remove } from '@tauri-apps/plugin-fs';
import logger from './logger';

const iCloudService = {
    VERSION: '1.0',
    _lockFiles: new Set(),
    _clientId: null, // Unique client identifier
    _sequenceNumber: 0, // Sync sequence counter
    _lastSyncMetadata: null,

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

                // Initialize client ID and load sync metadata
                await this._initializeClientId();
                await this._loadSyncMetadata();

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

    async _initializeClientId() {
        try {
            const metadataPath = await join(this._container, 'client-metadata.json');
            let metadata;
            try {
                const contents = await readFile(metadataPath);
                metadata = JSON.parse(new TextDecoder().decode(contents));
            } catch (e) {
                // Generate new client ID if file doesn't exist
                metadata = {
                    clientId: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    firstSeen: new Date().toISOString()
                };
                const file = await create(metadataPath);
                await file.write(new TextEncoder().encode(JSON.stringify(metadata, null, 2)));
                await file.close();
            }
            this._clientId = metadata.clientId;
        } catch (error) {
            logger.error(`[iCloudService] - Error initializing client ID: ${error}`);
            throw error;
        }
    },

    async _loadSyncMetadata() {
        try {
            const syncMetadataPath = await join(this._container, 'sync-metadata.json');
            try {
                const contents = await readFile(syncMetadataPath);
                this._lastSyncMetadata = JSON.parse(new TextDecoder().decode(contents));
            } catch (e) {
                this._lastSyncMetadata = { clients: {} };
            }
        } catch (error) {
            logger.error(`[iCloudService] - Error loading sync metadata: ${error}`);
            throw error;
        }
    },

    async _updateSyncMetadata(fileType, syncTimestamp) {
        const syncMetadataPath = await join(this._container, 'sync-metadata.json');
        this._lastSyncMetadata.clients[this._clientId] = {
            ...this._lastSyncMetadata.clients[this._clientId],
            lastSync: syncTimestamp,
            [fileType]: {
                lastSync: syncTimestamp,
                sequence: this._sequenceNumber
            }
        };

        const file = await create(syncMetadataPath);
        await file.write(new TextEncoder().encode(JSON.stringify(this._lastSyncMetadata, null, 2)));
        await file.close();
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
     * Acquire a lock for a file
     * @param {string} fileName - Name of file to lock
     */
    async _acquireLock(fileName) {
        if (this._lockFiles.has(fileName)) {
            throw new Error(`File ${fileName} is locked`);
        }
        this._lockFiles.add(fileName);
        return () => this._lockFiles.delete(fileName);
    },

    /**
     * Validate data before saving
     * @param {any} data - Data to validate
     */
    _validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }
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

        this._validateData(data);
        const releaseLock = await this._acquireLock(fileName);

        try {
            const filePath = await join(this._container, fileName);
            const file = await create(filePath);

            this._sequenceNumber++;
            const contentToSave = {
                version: this.VERSION,
                clientId: this._clientId,
                sequence: this._sequenceNumber,
                timestamp: new Date().toISOString(),
                timestampMs: Date.now(),
                data: data
            };

            const contents = JSON.stringify(contentToSave, null, 2);
            await file.write(new TextEncoder().encode(contents));
            await file.close();
            logger.info(`[iCloudService] - Saved file: ${fileName}`);
            return true;
        } catch (error) {
            logger.error(`[iCloudService] - Error saving file ${fileName}: ${error}`);
            throw error;
        } finally {
            releaseLock();
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
                const latestFiles = await Promise.all(filteredFiles.map(async f => ({
                    file: f,
                    metadata: await this.readFile(f.name)
                })));

                const validFiles = latestFiles.filter(f => f.metadata); // Remove any failed reads
                validFiles.sort((a, b) => {
                    // First compare by timestamp in milliseconds
                    const timeCompare = (b.metadata.timestampMs || 0) - (a.metadata.timestampMs || 0);
                    if (timeCompare !== 0) return timeCompare;

                    // If timestamps are equal, use sequence number
                    return (b.metadata.sequence || 0) - (a.metadata.sequence || 0);
                });

                if (validFiles.length === 0) return null;

                // Check for conflicts (multiple recent changes)
                const mostRecent = validFiles[0];
                const conflicts = validFiles.filter(f =>
                    Math.abs((f.metadata.timestampMs || 0) - (mostRecent.metadata.timestampMs || 0)) < 60000 // Within 1 minute
                    && f.metadata.clientId !== mostRecent.metadata.clientId
                );

                if (conflicts.length > 0) {
                    logger.warn(`[iCloudService] - Detected ${conflicts.length} potential conflicts for ${fileType}`);
                    // You could implement different conflict resolution strategies here
                    // For now, we'll use the most recent by timestamp + sequence number
                }

                return mostRecent.metadata;

            case 'cleanupOld':
                // Improved cleanup strategy
                filteredFiles.sort((a, b) => b.name.localeCompare(a.name));
                if (filteredFiles.length <= keepCount) {
                    return;
                }

                // Keep at least one file per month for the last 3 months
                const monthlyFiles = new Map();
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                filteredFiles.forEach(file => {
                    const dateMatch = file.name.match(/\d{4}-\d{2}-\d{2}/);
                    if (dateMatch) {
                        const fileDate = new Date(dateMatch[0]);
                        const monthKey = `${fileDate.getFullYear()}-${fileDate.getMonth()}`;

                        if (fileDate >= threeMonthsAgo && !monthlyFiles.has(monthKey)) {
                            monthlyFiles.set(monthKey, file);
                        }
                    }
                });

                // Files to preserve
                const preserveFiles = new Set([...monthlyFiles.values()].map(f => f.name));

                // Delete excess files while keeping monthly backups
                const filesToDelete = filteredFiles
                    .filter(f => !preserveFiles.has(f.name))
                    .slice(keepCount);

                for (const file of filesToDelete) {
                    await remove(await join(this._container, file.name));
                    logger.info(`[iCloudService] - Deleted old ${fileType} file: ${file.name}`);
                }
                break;

            case 'sync':
                const syncTimestamp = new Date().toISOString();
                const fileName = `${filePrefix}${Date.now()}_${this._clientId}.json`;
                await this.saveFile(fileName, {
                    timestamp: syncTimestamp,
                    [fileType]: data
                });

                await this._updateSyncMetadata(fileType, syncTimestamp);
                return { success: true };

            default:
                throw new Error('Invalid action specified');
        }
    }
};

// Initialize the service when imported
iCloudService.init();

export default iCloudService;