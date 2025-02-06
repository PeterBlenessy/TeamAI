import { readFile, writeFile, readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import logger from '@/services/logger';
import { updateSyncMetadata } from './metadata';
import { validatePersona } from './validation';
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
 * Sync a persona to iCloud
 */
export const syncPersona = async (service, personaId, data, changeType) => {
    logger.debug(`[iCloudService] Starting persona sync:`, {
        personaId,
        changeType,
        data: data ? {
            id: data.id,
            name: data.name,
            hasPrompt: !!data.prompt,
            hasAvatar: !!data.avatar,
            lastModified: data.lastModified
        } : null
    });

    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    try {
        validatePersona(data);

        const itemPath = await service.getItemPath('personas', personaId);
        logger.info(`[iCloudService] Writing persona at: ${itemPath}`);

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
        }, `write and verify persona ${personaId}`);

        // Update sync metadata
        await updateSyncMetadata(service, 'personas', {
            itemId: personaId,
            timestamp: metadata.timestamp,
            changeType,
            vectorClock: metadata.vectorClock
        });

        logger.info(`[iCloudService] - Successfully synced persona: ${personaId}`);
        return true;

    } catch (error) {
        const errorStr = String(error || 'Unknown error');
        logger.error(`[iCloudService] Persona sync failed:`, {
            error: errorStr,
            personaId,
            stack: error?.stack
        });
        throw error;
    }
};

/**
 * Get a persona from iCloud
 */
export const getPersona = async (service, personaId) => {
    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    const itemPath = await service.getItemPath('personas', personaId);
    logger.debug(`[iCloudService] - Getting persona:`, { personaId, path: itemPath });

    try {
        const metadata = await retry(async () => {
            const content = await readFile(itemPath);
            if (!content) {
                throw new Error('Empty file');
            }
            const parsed = JSON.parse(decoder.decode(content));
            
            logger.debug(`[iCloudService] Read persona:`, {
                path: itemPath,
                size: content.byteLength,
                metadataKeys: Object.keys(parsed),
                hasData: !!parsed.data,
                timestamp: parsed.timestamp
            });
            
            return parsed;
        }, `read persona ${personaId}`);

        if (!metadata) return null;

        // Verify metadata structure
        if (!metadata.version || !metadata.clientId || !metadata.data) {
            logger.error(`[iCloudService] - Invalid persona metadata structure:`, metadata);
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
        
        logger.error(`[iCloudService] Error reading persona:`, {
            personaId,
            path: itemPath,
            error: errorStr,
            stack: error?.stack
        });
        throw new Error(`Failed to read persona: ${errorStr}`);
    }
};

/**
 * Get changed personas since a specific time
 */
export const getChangedPersonas = async (service, since = null) => {
    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    const personasPath = await join(service._container, 'personas');
    const files = await readDir(personasPath);
    const items = [];

    for (const file of files) {
        if (!file.name.endsWith('.json')) continue;

        try {
            const personaId = file.name.replace('.json', '');
            const metadata = await getPersona(service, personaId);
            
            if (!metadata) continue;

            // Only include if newer than last sync and has valid data
            if (!since || new Date(metadata.timestamp) > new Date(since)) {
                items.push({
                    itemId: personaId,
                    data: metadata.data,
                    timestamp: metadata.timestamp,
                    changeType: metadata.changeType,
                    vectorClock: metadata.vectorClock
                });
            }
        } catch (error) {
            logger.error(`[iCloudService] - Error reading persona ${file.name}: ${error}`);
        }
    }

    return items;
};
