import { readFile, writeFile, readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import logger from '@/services/logger';
import { updateSyncMetadata } from './metadata';
import { validateConversation } from './validation';
import { syncStateManager } from '../syncStateManager';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

/**
 * Sync a conversation to iCloud
 */
export const syncConversation = async (service, conversationId, data, changeType) => {
    logger.debug(`[iCloudService] Starting conversation sync:`, {
        conversationId,
        changeType,
        messageCount: data?.messages?.length
    });

    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    try {
        validateConversation(data);

        const itemPath = await service.getItemPath('conversations', conversationId);
        logger.info(`[iCloudService] Writing conversation at: ${itemPath}`);

        // Create metadata
        const timestamp = new Date().toISOString();
        const metadata = {
            version: service.VERSION,
            clientId: service._clientId,
            timestamp,
            timestampMs: Date.now(),
            vectorClock: syncStateManager.getVectorClock(),
            changeType,
            data: JSON.parse(JSON.stringify(data)) // Deep clone
        };

        logger.debug(`[iCloudService] Preparing conversation metadata:`, {
            path: itemPath,
            conversationId,
            timestamp,
            messageCount: data.messages?.length,
            historyFields: Object.keys(data.history || {})
        });

        // Write and verify file with retries
        await retry(async () => {
            const content = encoder.encode(JSON.stringify(metadata, null, 2));
            await writeFile(itemPath, content);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify file was written correctly
            const verifyContent = await readFile(itemPath);
            if (!verifyContent) {
                throw new Error('File verification failed - file is empty');
            }

            return true;
        }, `write and verify conversation ${conversationId}`);

        // Update sync metadata
        await updateSyncMetadata(service, 'conversations', {
            itemId: conversationId,
            timestamp: metadata.timestamp,
            changeType,
            vectorClock: metadata.vectorClock
        });

        logger.info(`[iCloudService] - Successfully synced conversation: ${conversationId}`);
        return true;

    } catch (error) {
        const errorStr = String(error || 'Unknown error');
        logger.error(`[iCloudService] Conversation sync failed:`, {
            error: errorStr,
            conversationId,
            stack: error?.stack
        });
        throw error;
    }
};

/**
 * Get a conversation from iCloud
 */
export const getConversation = async (service, conversationId) => {
    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    const itemPath = await service.getItemPath('conversations', conversationId);
    logger.debug(`[iCloudService] - Getting conversation:`, { conversationId, path: itemPath });

    try {
        const metadata = await retry(async () => {
            const content = await readFile(itemPath);
            if (!content) {
                throw new Error('Empty file');
            }
            const parsed = JSON.parse(decoder.decode(content));
            
            logger.debug(`[iCloudService] Read conversation:`, {
                path: itemPath,
                size: content.byteLength,
                metadataKeys: Object.keys(parsed),
                hasData: !!parsed.data,
                timestamp: parsed.timestamp,
                messageCount: parsed.data?.messages?.length
            });
            
            return parsed;
        }, `read conversation ${conversationId}`);

        if (!metadata) return null;

        // Verify metadata structure
        if (!metadata.version || !metadata.clientId || !metadata.data) {
            logger.error(`[iCloudService] - Invalid conversation metadata structure:`, metadata);
            throw new Error('Invalid metadata structure');
        }

        return metadata;

    } catch (error) {
        const errorStr = String(error || 'Unknown error');
        if (errorStr.toLowerCase().includes('no such file') || 
            errorStr.toLowerCase().includes('not found') || 
            errorStr.toLowerCase().includes('enoent')) {
            return null;
        }
        
        logger.error(`[iCloudService] Error reading conversation:`, {
            conversationId,
            path: itemPath,
            error: errorStr,
            stack: error?.stack
        });
        throw new Error(`Failed to read conversation: ${errorStr}`);
    }
};

/**
 * Get changed conversations since a specific time
 */
export const getChangedConversations = async (service, since = null) => {
    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    const conversationsPath = await join(service._container, 'conversations');
    const files = await readDir(conversationsPath);
    const items = [];

    for (const file of files) {
        if (!file.name.endsWith('.json')) continue;

        try {
            const conversationId = file.name.replace('.json', '');
            const metadata = await getConversation(service, conversationId);
            
            if (!metadata) continue;

            // Only include if newer than last sync and has valid data
            if (!since || new Date(metadata.timestamp) > new Date(since)) {
                items.push({
                    itemId: conversationId,
                    data: metadata.data,
                    timestamp: metadata.timestamp,
                    changeType: metadata.changeType,
                    vectorClock: metadata.vectorClock
                });
            }
        } catch (error) {
            logger.error(`[iCloudService] - Error reading conversation ${file.name}: ${error}`);
        }
    }

    return items;
};
