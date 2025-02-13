import { CloudStorageError } from '@/services/cloudSyncService';
import logger from '@/services/logger';

/**
 * @typedef {Object} ConversationData
 * @property {Object} history - Conversation metadata and settings
 * @property {string} history.id - Unique identifier
 * @property {string} [history.title] - Chat title
 * @property {Object} [history.settings] - Conversation settings
 * @property {Array<string>} [history.participants] - Participant IDs
 * @property {number} [history.lastModified] - Last modification timestamp
 * @property {Array<Message>} messages - Chat messages
 */

/**
 * @typedef {Object} Message
 * @property {string} id - Unique message identifier
 * @property {string} content - Message content
 * @property {string} [role] - Message sender role (user, assistant)
 * @property {Array<Object>} [images] - Attached images
 */

/**
 * Validate conversation data structure
 */
export function validateConversation(data) {
    if (!data?.history || typeof data.history !== 'object') {
        throw new CloudStorageError('Conversation must have history object');
    }
    if (!data.history.id) {
        throw new CloudStorageError('Conversation must have an ID');
    }
    if (data.messages && !Array.isArray(data.messages)) {
        throw new CloudStorageError('Messages must be an array');
    }
    if (data.messages?.some(msg => !msg.id || !msg.content)) {
        throw new CloudStorageError('Each message must have id and content');
    }
}

/**
 * Parse conversation data from storage format
 */
export function parseConversationData(content) {
    try {
        const syncData = JSON.parse(content);
        if (!syncData?.data) {
            logger.warn('[CloudSync] Invalid conversation data structure:', {
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
 * Prepare conversation data for storage
 */
export function prepareConversationData(data) {
    validateConversation(data);
    return {
        lastModified: Date.now(),
        data: JSON.parse(JSON.stringify(data)) // Deep clone to avoid modifying original
    }; 
}