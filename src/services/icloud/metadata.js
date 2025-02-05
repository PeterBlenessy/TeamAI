import { join } from '@tauri-apps/api/path';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import logger from '@/services/logger';
import { syncStateManager } from '../syncStateManager';

/**
 * Retry operation with exponential backoff
 */
const retry = async (operation, description, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`);
            const result = await operation();
            logger.debug(`[iCloudService] - Successfully completed ${description}`);
            return result;
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, String(error));
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
    }
};

/**
 * Initialize client ID metadata
 */
const initializeClientId = async (service) => {
    try {
        const metadataPath = await join(service._container, 'client-metadata.json');
        logger.debug(`[iCloudService] - Initializing client ID at: ${metadataPath}`);

        let metadata;
        try {
            // Attempt to read existing metadata with retries
            const contents = await retry(async () => {
                const content = await readFile(metadataPath);
                if (!content) throw new Error('Empty metadata file');
                return content;
            }, 'read client metadata');

            metadata = JSON.parse(new TextDecoder().decode(contents));
            logger.debug(`[iCloudService] - Loaded existing client metadata:`, {
                clientId: metadata.clientId,
                firstSeen: metadata.firstSeen
            });
        } catch (e) {
            // Create new metadata if file doesn't exist or is invalid
            metadata = {
                clientId: syncStateManager.getClientId(),
                firstSeen: new Date().toISOString()
            };
            logger.debug(`[iCloudService] - Creating new client metadata:`, metadata);

            // Write new metadata file with retries
            await retry(async () => {
                const content = new TextEncoder().encode(JSON.stringify(metadata, null, 2));
                await writeFile(metadataPath, content);
                await new Promise(resolve => setTimeout(resolve, 100));

                // Verify the write
                const verifyContent = await readFile(metadataPath);
                if (!verifyContent) {
                    throw new Error('Metadata file verification failed - file is empty');
                }
                return true;
            }, 'write new client metadata');
        }

        service._clientId = metadata.clientId;
        logger.info(`[iCloudService] - Successfully initialized client ID: ${service._clientId}`);
    } catch (error) {
        logger.error(`[iCloudService] - Error initializing client ID:`, {
            error: String(error),
            stack: error.stack
        });
        throw new Error(`Failed to initialize client ID: ${error.message}`);
    }
};

/**
 * Load sync metadata from file
 */
const loadSyncMetadata = async (service) => {
    try {
        const syncMetadataPath = await join(service._container, 'sync-metadata.json');
        logger.debug(`[iCloudService] - Loading sync metadata from: ${syncMetadataPath}`);

        try {
            // Attempt to read existing metadata with retries
            const contents = await retry(async () => {
                const content = await readFile(syncMetadataPath);
                if (!content) {
                    // Return default metadata for empty file
                    return new TextEncoder().encode(JSON.stringify({ clients: {}, vectorClock: {} }));
                }
                return content;
            }, 'read sync metadata');

            service._lastSyncMetadata = JSON.parse(new TextDecoder().decode(contents));
            logger.debug(`[iCloudService] - Loaded sync metadata:`, {
                clientCount: Object.keys(service._lastSyncMetadata.clients || {}).length,
                hasVectorClock: !!service._lastSyncMetadata.vectorClock
            });
        } catch (e) {
            // Create new metadata if file doesn't exist or is invalid
            service._lastSyncMetadata = { clients: {}, vectorClock: {} };
            logger.debug(`[iCloudService] - Creating new sync metadata`, service._lastSyncMetadata);

            // Write new metadata file with retries
            await retry(async () => {
                const content = new TextEncoder().encode(JSON.stringify(service._lastSyncMetadata, null, 2));
                await writeFile(syncMetadataPath, content);
                await new Promise(resolve => setTimeout(resolve, 100));

                // Verify the write
                const verifyContent = await readFile(syncMetadataPath);
                if (!verifyContent) {
                    throw new Error('Sync metadata file verification failed - file is empty');
                }
                return true;
            }, 'write new sync metadata');
        }

        logger.info(`[iCloudService] - Successfully loaded sync metadata`);
    } catch (error) {
        logger.error(`[iCloudService] - Error loading sync metadata:`, {
            error: String(error),
            stack: error.stack
        });
        throw new Error(`Failed to load sync metadata: ${error.message}`);
    }
};

/**
 * Update sync metadata for a specific item
 */
export const updateSyncMetadata = async (service, fileType, syncInfo) => {
    const syncMetadataPath = await join(service._container, 'sync-metadata.json');
    const vectorClock = syncStateManager.getVectorClock();
    
    logger.debug('[iCloudService] Updating sync metadata:', {
        fileType,
        itemId: syncInfo.itemId,
        changeType: syncInfo.changeType
    });
    
    // Extract timestamp from sync info or use current time
    const timestamp = typeof syncInfo === 'object' ? 
        syncInfo.timestamp || new Date().toISOString() :
        new Date().toISOString();

    // Update metadata in memory first
    service._lastSyncMetadata.clients[service._clientId] = {
        ...service._lastSyncMetadata.clients[service._clientId],
        lastSync: timestamp,
        [fileType]: {
            lastSync: timestamp,
            itemId: syncInfo.itemId,
            changeType: syncInfo.changeType,
            sequence: service._sequenceNumber,
            vectorClock: syncInfo.vectorClock || vectorClock
        }
    };

    try {
        // Write metadata file with retries
        await retry(async () => {
            const content = new TextEncoder().encode(JSON.stringify(service._lastSyncMetadata, null, 2));
            await writeFile(syncMetadataPath, content);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify file was written correctly
            const verifyContent = await readFile(syncMetadataPath);
            if (!verifyContent) {
                throw new Error('Metadata file verification failed - file is empty');
            }
            return true;
        }, `write sync metadata for ${fileType}`);

        logger.debug(`[iCloudService] Successfully updated sync metadata for:`, {
            fileType,
            itemId: syncInfo.itemId
        });
    } catch (error) {
        logger.error(`[iCloudService] Failed to update sync metadata:`, {
            error: String(error),
            fileType,
            itemId: syncInfo.itemId,
            stack: error?.stack
        });
        throw new Error(`Failed to update sync metadata: ${error.message}`);
    }
};

/**
 * Setup all metadata for the service
 */
export const setupMetadata = async (service) => {
    await initializeClientId(service);
    await loadSyncMetadata(service);
};
