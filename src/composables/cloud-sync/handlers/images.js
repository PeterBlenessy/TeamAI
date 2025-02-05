import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings-store';
import iCloudService from '@/services/iCloudService';
import { imageDB } from '@/services/localforage';
import { createBaseHandler } from '../createBaseHandler';
import { withLogging } from '../middleware/logging';
import { withValidation } from '../middleware/validation';
import logger from '@/services/logger';

export const createImagesHandler = () => {
    const settingsStore = useSettingsStore();
    const { syncOptions } = storeToRefs(settingsStore);

    // Create base implementation
    const handler = createBaseHandler({
        enabled: () => syncOptions.value.images,

        sync: async (itemId, data) => {
            logger.debug('[CloudSync:Images] Syncing image:', {
                key: itemId,
                type: data?.constructor?.name,
                size: data instanceof Blob ? data.size : data?.byteLength
            });

            return iCloudService.syncImage(itemId, data);
        },

        getChanges: async () => {
            // Get missing images from cloud
            const cloudChanges = await iCloudService.importCloudImages();
            
            logger.debug('[CloudSync:Images] Retrieved cloud changes:', {
                count: cloudChanges.length
            });

            return cloudChanges;
        },

        applyChange: async (item) => {
            try {
                if (!item.itemId || !item.data) {
                    throw new Error('Invalid image data from cloud');
                }

                // Check if we already have this image
                const existing = await imageDB.getItem(item.itemId);
                if (existing) {
                    logger.debug('[CloudSync:Images] Image already exists locally:', item.itemId);
                    return;
                }

                // Store the image in local DB
                await imageDB.setItem(item.itemId, item.data);
                
                logger.debug('[CloudSync:Images] Stored image in local DB:', {
                    key: item.itemId,
                    size: item.data instanceof Blob ? item.data.size : item.data?.byteLength
                });
            } catch (error) {
                logger.error('[CloudSync:Images] Error applying image change:', {
                    id: item.itemId,
                    error: String(error),
                    stack: error?.stack
                });
            }
        }
    });

    // Enhance with middleware
    return withLogging(withValidation(handler, 'images'));
};
