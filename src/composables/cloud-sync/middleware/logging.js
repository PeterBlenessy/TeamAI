import logger from '@/services/logger';

/**
 * Adds logging capabilities to a sync handler
 * @param {Object} handler - The sync handler to enhance
 * @returns {Object} Handler with logging functionality
 */
export const withLogging = (handler) => ({
    ...handler,
    
    sync: async (itemId, data, changeType) => {
        logger.debug('[CloudSync] Starting sync:', {
            itemId,
            changeType,
            dataType: typeof data,
            hasData: !!data
        });
        
        try {
            const result = await handler.sync(itemId, data, changeType);
            logger.debug('[CloudSync] Sync complete:', { itemId });
            return result;
        } catch (error) {
            logger.error('[CloudSync] Sync failed:', {
                itemId,
                error: String(error),
                stack: error?.stack
            });
            throw error;
        }
    },

    getChanges: async (...args) => {
        logger.debug('[CloudSync] Getting changes');
        const changes = await handler.getChanges(...args);
        logger.debug('[CloudSync] Retrieved changes:', {
            count: changes?.length || 0
        });
        return changes;
    },

    applyChange: (item) => {
        logger.debug('[CloudSync] Applying change:', {
            itemId: item?.itemId,
            hasData: !!item?.data
        });
        return handler.applyChange(item);
    }
});
