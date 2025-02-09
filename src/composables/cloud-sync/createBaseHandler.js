import logger from '@/services/logger';
import { withLogging } from './middleware/logging';
import { withValidation } from './middleware/validation';

/**
 * Creates a base sync handler with default implementations
 * @param {Object} implementation - Handler specific implementations
 * @returns {Object} Handler with default and custom implementations merged
 */
export const createBaseHandler = (implementation = {}) => {
    const baseHandler = {
        // Whether this sync handler is enabled
        enabled: () => true,
        
        // Get pending uploads
        getPendingUploads: async () => [],
        
        // Transform data for storage
        transform: async (data) => data,
        
        // Validate data structure
        validate: async () => true,
        
        // Compare items for changes
        compareItems: (local, remote) => {
            if (!local || !remote) return true;
            
            // Compare modified timestamps if available
            if (local.lastModified && remote.lastModified) {
                return new Date(local.lastModified) > new Date(remote.lastModified);
            }
            
            // Fall back to deep comparison
            return JSON.stringify(local) !== JSON.stringify(remote);
        },
        
        // Sync an item to cloud
        sync: async () => {
            throw new Error('Sync method must be implemented');
        },
        
        // Get changed items from cloud
        getChanges: async () => [],
        
        // Apply a change from cloud
        applyChange: async () => {
            throw new Error('ApplyChange method must be implemented');
        },

        // Helper method to track errors
        recordError: (error, context = {}) => {
            logger.error(`[CloudSync:${implementation.type || 'unknown'}] Error:`, {
                ...context,
                error: String(error),
                stack: error?.stack
            });
            throw error;
        }
    };

    // Create handler with custom implementation
    const handler = {
        ...baseHandler,
        ...implementation,
        
        // Ensure type is set
        type: implementation.type || 'unknown'
    };

    // Add middleware
    if (implementation.type) {
        return withLogging(withValidation(handler, implementation.type));
    }

    return handler;
};
