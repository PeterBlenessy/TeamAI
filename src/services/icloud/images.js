import { readFile, writeFile, readDir, remove, mkdir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import logger from '@/services/logger';
import { imageDB } from '@/services/localforage';
import { validateImage } from './validation';

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
 * Sync an image to iCloud
 */
export const syncImage = async (service, imageId, value) => {
    await service._ensureInitialized();
    if (!service._isAvailable) {
        throw new Error('iCloud is not available');
    }

    // Validate and normalize image data
    if (!imageId) {
        throw new Error('Image ID is required');
    }

    const imageData = validateImage(value);

    const imagesPath = await join(service._container, 'images');
    const imagePath = await join(imagesPath, imageId);

    logger.debug(`[iCloudService] Starting image sync:`, {
        key: imageId,
        path: imagePath,
        type: value.constructor.name,
        size: value.byteLength || value.size || 0
    });

    try {
        // Ensure directory exists first
        await mkdir(imagesPath, { recursive: true });

        // Write and verify file with retries
        await retry(async () => {
            // Write the file
            await writeFile(imagePath, imageData);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify file was written correctly
            const verifyContent = await readFile(imagePath);
            if (!verifyContent || verifyContent.byteLength !== imageData.size) {
                throw new Error('Image verification failed - size mismatch or file empty');
            }

            return true;
        }, `write and verify image ${imageId}`);

        logger.info(`[iCloudService] - Successfully synced image to cloud: ${imageId}`);
        return true;

    } catch (error) {
        logger.error(`[iCloudService] - Failed to sync image:`, {
            key: imageId,
            path: imagePath,
            error: String(error),
            stack: error?.stack
        });
        throw new Error(`Failed to sync image ${imageId}: ${error.message}`);
    }
};

/**
 * Import cloud images to local DB
 */
export const importCloudImages = async (service, since = null) => {
    try {
        const imagesPath = await join(service._container, 'images');
        const cloudImages = await readDir(imagesPath);
        const importedImages = [];

        // Import missing images from cloud
        for (const file of cloudImages) {
            try {
                if (!await imageDB.getItem(file.name)) {
                    const imagePath = await join(imagesPath, file.name);
                    const imageBlob = await readFile(imagePath);
                    await imageDB.setItem(file.name, imageBlob);
                    logger.info(`[iCloudService] - Imported image from cloud: ${file.name}`);
                    importedImages.push({
                        itemId: file.name,
                        data: imageBlob,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                logger.error(`[iCloudService] - Error importing image ${file.name}: ${error}`);
            }
        }

        return importedImages;
    } catch (error) {
        logger.error(`[iCloudService] - Error importing cloud images: ${error}`);
        return [];
    }
};

/**
 * Clean up orphaned images that aren't referenced in any conversations
 */
export const cleanupOrphanedImages = async (service) => {
    try {
        const imagesPath = await join(service._container, 'images');
        const cloudImages = await readDir(imagesPath);
        
        // Get all image references from conversations
        const changedConvs = await service.getChangedConversations();
        const imageRefs = new Set();
        changedConvs.forEach(({ data }) => {
            // Check messages array in both history and messages fields
            if (data.history?.messages) {
                data.history.messages.forEach(message => {
                    if (message.choices) {
                        message.choices.forEach(choice => {
                            if (choice.content?.startsWith('image-')) {
                                imageRefs.add(choice.content);
                            }
                        });
                    }
                });
            }
            if (data.messages) {
                data.messages.forEach(message => {
                    if (message.choices) {
                        message.choices.forEach(choice => {
                            if (choice.content?.startsWith('image-')) {
                                imageRefs.add(choice.content);
                            }
                        });
                    }
                });
            }
        });

        // Remove any images that aren't referenced in conversations
        for (const file of cloudImages) {
            if (!imageRefs.has(file.name)) {
                try {
                    const imagePath = await join(imagesPath, file.name);
                    await remove(imagePath);
                    logger.info(`[iCloudService] - Deleted orphaned image: ${file.name}`);
                } catch (error) {
                    logger.error(`[iCloudService] - Error deleting orphaned image ${file.name}: ${error}`);
                }
            }
        }
    } catch (error) {
        logger.error(`[iCloudService] - Error cleaning up orphaned images: ${error}`);
    }
};
