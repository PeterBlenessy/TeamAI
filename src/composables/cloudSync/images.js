import { join } from '@tauri-apps/api/path';
import logger from '@/services/logger';
import { imageDB, teamsDB } from '@/services/localforage';
import { CloudStorageError } from '@/services/cloudSyncService';

/**
 * @typedef {Object} ImageData
 * @property {Blob|ArrayBuffer} data - Raw image data
 * @property {string} [type] - MIME type if available
 * @property {Object} [metadata] - Optional image metadata
 * @property {number} [metadata.width] - Image width if available
 * @property {number} [metadata.height] - Image height if available
 * @property {string} [metadata.originalName] - Original filename
 */

/**
 * @typedef {Object} ImageMetadata 
 * @property {string} id - Unique identifier
 * @property {string} name - Image file name
 * @property {string} type - MIME type
 * @property {number} size - File size in bytes
 * @property {Date} [created] - Creation timestamp
 * @property {Date} [modified] - Last modification timestamp
 */

/**
 * Validate image metadata and content
 */
export function validateImage(data) {
    if (!data || !(data instanceof Blob || data instanceof ArrayBuffer)) {
        throw new CloudStorageError('Invalid image data: must be Blob or ArrayBuffer');
    }
}

/**
 * Parse image metadata from storage format
 */
export function parseImageMetadata(content) {
    try {
        const metadata = JSON.parse(content);
        if (!metadata?.id) {
            logger.warn('[CloudSync] Invalid image metadata:', {
                keys: Object.keys(metadata || {})
            });
            return null;
        }
        return metadata;
    } catch (error) {
        logger.error('[CloudSync] Image metadata parse error:', {
            error,
            preview: content.slice(0, 100) + '...'
        });
        throw error;
    }
}

/**
 * Prepare image metadata for storage
 */
export function prepareImageMetadata(id, data) {
    validateImage(data);
    return {
        id,
        name: `${id}.bin`,
        type: data instanceof Blob ? data.type : 'application/octet-stream',
        size: data instanceof Blob ? data.size : data.byteLength,
        modified: new Date().toISOString()
    };
}

/**
 * Write image to cloud storage
 */
export async function syncImage(imageId, data) {
    try {
        validateImage(data);
        const provider = getCloudProvider();
        const path = await join(provider.getContainerPath(), 'images', imageId);

        // Convert ArrayBuffer to Blob if needed
        const blob = data instanceof Blob ? data : new Blob([data]);
        await provider.writeFile(path, blob);
        
        logger.info('[CloudSync] Synced image:', { 
            imageId, 
            size: blob.size,
            type: blob.type 
        });
        return true;
    } catch (error) {
        logger.error('[CloudSync] Error syncing image:', { error, imageId });
        throw error;
    }
}

/**
 * Read image from cloud storage
 */
export async function getImage(imageId) {
    try {
        const provider = getCloudProvider();
        const path = await join(provider.getContainerPath(), 'images', imageId);
        return await provider.readFile(path);
    } catch (error) {
        if (error.message?.includes('no such file')) {
            return null;
        }
        logger.error('[CloudSync] Error reading image:', { error, imageId });
        throw error;
    }
}

/**
 * List changed images since last sync
 */
export async function getChangedImages(since = null) {
    try {
        const provider = getCloudProvider();
        const dirPath = await join(provider.getContainerPath(), 'images');
        const files = await provider.listFiles(dirPath);
        const items = [];

        for (const file of files) {
            // Skip directories and hidden files
            if (file.isDirectory || file.name.startsWith('.')) continue;

            try {
                items.push({
                    id: file.name,
                    lastModified: file.modifiedAt,
                    size: file.size
                });
            } catch (error) {
                logger.error('[CloudSync] Error reading image file:', { error, file });
            }
        }

        if (since) {
            const sinceDate = new Date(since);
            return items.filter(item => new Date(item.lastModified) > sinceDate);
        }

        return items;
    } catch (error) {
        logger.error('[CloudSync] Error listing images:', error);
        throw error;
    }
}

/**
 * Clean up unreferenced images from storage
 */
export async function cleanupImages(referencedIds) {
    try {
        const provider = getCloudProvider();
        const dirPath = await join(provider.getContainerPath(), 'images');
        const files = await provider.listFiles(dirPath);
        
        for (const file of files) {
            if (!referencedIds.includes(file.name)) {
                try {
                    await provider.deleteFile(await join(dirPath, file.name));
                    logger.info('[CloudSync] Removed unreferenced image:', file.name);
                } catch (error) {
                    logger.error('[CloudSync] Error removing image:', { error, file });
                }
            }
        }
    } catch (error) {
        logger.error('[CloudSync] Error during image cleanup:', error);
        throw error;
    }
}

/**
 * Get IDs of images referenced in messages
 */
export async function getMessageImageIds() {
    try {
        const messages = JSON.parse(await teamsDB.getItem('messages') || '[]');
        const imageIds = new Set();
        
        messages.forEach(message => {
            if (message.choices) {
                message.choices.forEach(choice => {
                    if (choice.content) {
                        imageIds.add(choice.content);
                    }
                });
            }
        });
        
        return Array.from(imageIds);
    } catch (error) {
        logger.error('[CloudSync] Error getting message image IDs:', error);
        return [];
    }
}

/**
 * Get list of all image IDs from IndexedDB
 */
export async function getAllImageIds() {
    try {
        // Get images referenced in messages
        const messageImages = await getMessageImageIds();
        // Get all images from imageDB
        const storedImages = await imageDB.keys();
        // Combine and deduplicate
        return [...new Set([...messageImages, ...storedImages])];
    } catch (error) {
        logger.error('[CloudSync] Error getting image IDs:', error);
        throw error;
    }
}

/**
 * Get image data from IndexedDB
 */
export async function getLocalImage(id) {
    try {
        const data = await imageDB.getItem(id);
        if (!data) {
            logger.debug('[CloudSync] No image found in IndexedDB:', { id });
            return null;
        }
        validateImage(data);
        return data;
    } catch (error) {
        logger.error('[CloudSync] Error getting image from IndexedDB:', { error, id });
        throw error;
    }
}