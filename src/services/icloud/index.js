import { homeDir, join } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { readDir, mkdir } from '@tauri-apps/plugin-fs';
import logger from '@/services/logger';
import { setupMetadata } from './metadata';
import { syncPersona, getPersona, getChangedPersonas } from './personas';
import { syncConversation, getConversation, getChangedConversations } from './conversations';
import { syncImage, importCloudImages, cleanupOrphanedImages } from './images';
import { syncStateManager } from '../syncStateManager';

class ICloudService {
    VERSION = '1.0';
    _lockFiles = new Set();
    _clientId = null;
    _sequenceNumber = 0;
    _lastSyncMetadata = null;
    _conflicts = null;

    // Internal state
    _isAvailable = false;
    _container = null;
    _initialized = false;

    constructor() {
        // Bind methods to ensure proper 'this' context
        this.syncPersona = syncPersona.bind(null, this);
        this.getPersona = getPersona.bind(null, this);
        this.getChangedPersonas = getChangedPersonas.bind(null, this);
        
        this.syncConversation = syncConversation.bind(null, this);
        this.getConversation = getConversation.bind(null, this);
        this.getChangedConversations = getChangedConversations.bind(null, this);
        
        this.syncImage = syncImage.bind(null, this);
        this.importCloudImages = importCloudImages.bind(null, this);
        this.cleanupOrphanedImages = cleanupOrphanedImages.bind(null, this);
    }

    async init() {
        try {
            const platformName = await platform();
            logger.info(`[iCloudService] - Initializing with platform: ${platformName}`);
            
            if (await this._isMacOS()) {
                const home = await homeDir();
                const iCloudPath = await join(home, 'Library', 'Mobile Documents');
                const iCloudDocsPath = await join(iCloudPath, 'com~apple~CloudDocs');
                this._container = await join(iCloudDocsPath, 'TeamAI');

                try {
                    logger.info(`[iCloudService] - Setting up iCloud container at: ${this._container}`);
                    
                    // Create main container
                    await mkdir(this._container, { recursive: true });
                    const containerExists = await readDir(this._container);
                    logger.info(`[iCloudService] - Container created with ${containerExists.length} items`);

                    // Create and validate subdirectories
                    const dirs = ['personas', 'conversations', 'images'];
                    for (const dir of dirs) {
                        const path = await join(this._container, dir);
                        await mkdir(path, { recursive: true });
                        logger.info(`[iCloudService] - Created directory: ${path}`);
                    }

                    await setupMetadata(this);

                    this._isAvailable = true;
                    this._initialized = true;
                    logger.info('[iCloudService] - Initialized successfully');

                } catch (error) {
                    logger.error(`[iCloudService] - Error setting up container: ${error}`);
                    throw error;
                }
            } else {
                logger.warn(`[iCloudService] - iCloud is only supported on macOS (detected: ${platformName})`);
                this._isAvailable = false;
            }
        } catch (error) {
            logger.error(`[iCloudService] - Initialization failed:`, {
                error: String(error),
                stack: error.stack,
                type: error.constructor.name
            });
            this._isAvailable = false;
        }
    }

    async _isMacOS() {
        const platformName = await platform();
        logger.info(`[iCloudService] - Current platform name: ${platformName}`);
        return platformName === 'macos';
    }

    async _ensureInitialized() {
        if (!this._initialized) {
            await this.init();
        }
    }

    isAvailable() {
        return this._isAvailable;
    }

    async _acquireLock(fileName) {
        if (this._lockFiles.has(fileName)) {
            throw new Error(`File ${fileName} is locked`);
        }
        this._lockFiles.add(fileName);
        return () => this._lockFiles.delete(fileName);
    }

    async getItemPath(type, itemId) {
        await this._ensureInitialized();
        return join(this._container, type, `${itemId}.json`);
    }
}

// Create and initialize singleton instance
const iCloudService = new ICloudService();
await iCloudService.init();

export default iCloudService;
