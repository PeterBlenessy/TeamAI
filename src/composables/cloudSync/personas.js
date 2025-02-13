import { CloudStorageError } from '@/services/cloudSyncService';
import logger from '@/services/logger';

/**
 * @typedef {Object} PersonaData
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} prompt - System prompt/instructions
 * @property {string} [avatar] - Base64 or URL of avatar image
 * @property {boolean} [readonly] - Whether persona can be modified
 * @property {Object} [settings] - Persona-specific settings
 * @property {number} [lastModified] - Last modification timestamp
 */

/**
 * Validate persona data structure
 */
export function validatePersona(data) {
    if (!data?.id || !data?.name || !data?.prompt) {
        throw new CloudStorageError('Invalid persona data: missing required fields');
    }
}

/**
 * Parse persona data from storage format
 */
export function parsePersonaData(content) {
    try {
        const syncData = JSON.parse(content);
        if (!syncData?.data) {
            logger.warn('[CloudSync] Invalid persona data structure:', {
                keys: Object.keys(syncData || {})
            });
            return null;
        }
        return syncData.data;
    } catch (error) {
        logger.error('[CloudSync] JSON parse error:', {
            error,
            preview: content.slice(0, 100) + '...'
        });
        throw error;
    }
}

/**
 * Prepare persona data for storage
 */
export function preparePersonaData(data) {
    validatePersona(data);
    // Create clean data object without any reactive wrappers
    const cleanData = JSON.parse(JSON.stringify(data));
    return {
        lastModified: Date.now(),
        data: {
            ...cleanData,
            readonly: cleanData.readonly || false // Ensure readonly flag is present
        }
    };
}