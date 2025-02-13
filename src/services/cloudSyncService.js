import { join } from '@tauri-apps/api/path';
import logger from '@/services/logger';

/**
 * Cloud storage provider interface
 * @typedef {Object} StorageProvider
 * @property {() => Promise<void>} init
 * @property {(path: string) => Promise<Blob|ArrayBuffer>} readFile
 * @property {(path: string, data: Blob|ArrayBuffer) => Promise<void>} writeFile
 * @property {(path: string) => Promise<void>} deleteFile
 * @property {(dirPath: string) => Promise<string[]>} listFiles
 * @property {(path: string) => Promise<void>} createDir
 * @property {(since?: Date) => Promise<Change[]>} listChanges
 * @property {() => boolean} isAvailable
 * @property {(path: string) => Promise<FileMetadata>} getMetadata
 */

/**
 * @typedef {Object} FileMetadata
 * @property {Date} modified
 * @property {number} size
 * @property {'file'|'directory'} type
 * @property {string} [name]
 * @property {string} [path]
 */

/**
 * @typedef {Object} Change
 * @property {string} path
 * @property {'added'|'modified'|'deleted'} type
 * @property {Date} timestamp
 */

/**
 * Error types
 */
export class CloudStorageError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'CloudStorageError';
        this.details = details;
    }
}

export class ValidationError extends CloudStorageError {
    constructor(message, details = {}) {
        super(message, details);
        this.name = 'ValidationError';
    }
}

/**
 * Creates a cloud sync service instance
 */
function createCloudSyncService() {
    // Private state
    let currentProvider = null;

    // Private functions
    const validateProvider = () => {
        if (!currentProvider) {
            throw new CloudStorageError('No storage provider initialized');
        }
    };

    /**
     * Validate data type for sync operations
     */
    const validateDataType = (type, data) => {
        // Binary data (images)
        if (type === 'images' && !data.name?.endsWith('.json')) {
            if (!(data instanceof Blob || data instanceof ArrayBuffer || data instanceof Uint8Array)) {
                throw new ValidationError('Image data must be Blob, ArrayBuffer, or Uint8Array');
            }
        }
        // JSON data (metadata, personas, conversations)
        else if (!(typeof data === 'string' || data instanceof Uint8Array)) {
            throw new ValidationError('JSON data must be string or Uint8Array');
        }
    };

    // Public interface
    return {
        /**
         * Initialize with a storage provider
         * @param {StorageProvider} provider
         */
        async initialize(provider) {
            try {
                await provider.init();
                currentProvider = provider;
            } catch (error) {
                throw new CloudStorageError('Failed to initialize provider', { cause: error });
            }
        },

        /**
         * Get the current provider
         */
        getProvider() {
            validateProvider();
            return currentProvider;
        },

        /**
         * Check if cloud sync is available
         */
        isAvailable() {
            return currentProvider?.isAvailable() ?? false;
        },

        /**
         * Write data to storage
         */
        async syncData(type, id, data) {
            validateProvider();
            validateDataType(type, data);
            const path = await join(currentProvider.getContainerPath(), type, id);
            await currentProvider.writeFile(path, data);
            logger.debug('[CloudSync] Synced data:', {
                type,
                id,
                dataType: typeof data === 'string' ? 'json' : 'binary',
                size: data instanceof Blob ? data.size : 
                      data instanceof ArrayBuffer ? data.byteLength :
                      data.length
            });
        },

        /**
         * List files in a directory
         */
        async listFiles(type) {
            validateProvider();
            const dirPath = await join(currentProvider.getContainerPath(), type);
            logger.debug(`[CloudSync] Reading ${type} from:`, { dirPath });
            return await currentProvider.listFiles(dirPath);
        },

        /**
         * Delete a file
         */
        async deleteFile(type, id) {
            validateProvider();
            const path = await join(currentProvider.getContainerPath(), type, id);
            await currentProvider.deleteFile(path);
            logger.debug(`[CloudSync] Deleted ${type}:`, { id });
        },

        /**
         * Read data from storage
         */
        async getData(type, id) {
            validateProvider();
            const path = await join(currentProvider.getContainerPath(), type, id);
            const data = await currentProvider.readFile(path);
            // Provider should handle decoding text vs binary
            return data;
        }
    };
}

// Export singleton instance
export const cloudSyncService = createCloudSyncService();