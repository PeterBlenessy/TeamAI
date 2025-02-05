import logger from '@/services/logger';

/**
 * Validate and normalize persona data
 */
export const validatePersona = (data) => {
    try {
        // Log incoming data structure
        logger.debug('[iCloudService] Validating persona:', {
            incoming: {
                hasId: !!data?.id,
                hasName: !!data?.name,
                hasPrompt: !!data?.prompt,
                fields: data ? Object.keys(data) : []
            }
        });

        if (!data?.id) {
            throw new Error('Persona must have an id');
        }

        // Normalize data - ensure required fields exist with defaults
        const normalized = {
            id: data.id,
            name: data.name || 'Unnamed',
            prompt: data.prompt || '',
            readonly: data.readonly ?? true,
            lastModified: data.lastModified || Date.now(),
            // Preserve any additional fields
            ...data
        };

        // Log if any normalization was needed
        if (JSON.stringify(data) !== JSON.stringify(normalized)) {
            logger.info('[iCloudService] Persona data normalized:', {
                added: Object.keys(normalized).filter(k => !data.hasOwnProperty(k)),
                original: data,
                normalized
            });
        }

        return normalized;
    } catch (error) {
        logger.error('[iCloudService] Persona validation error:', {
            error: String(error),
            stack: error?.stack,
            data: data ? {
                hasId: !!data.id,
                fields: Object.keys(data)
            } : 'null'
        });
        throw error;
    }
};

/**
 * Validate and normalize conversation data
 */
export const validateConversation = (data) => {
    try {
        // Log incoming data structure
        logger.debug('[iCloudService] Validating conversation:', {
            incoming: {
                hasHistory: !!data?.history,
                hasMessages: !!data?.messages,
                messageCount: data?.messages?.length || 0,
                historyFields: data?.history ? Object.keys(data.history) : [],
                fields: data ? Object.keys(data) : []
            }
        });

        // Ensure required arrays exist
        if (!data.messages) {
            data.messages = [];
            logger.info('[iCloudService] Added missing messages array');
        }

        if (!data.history) {
            data.history = {};
            logger.info('[iCloudService] Added missing history object');
        }

        // Get or create conversationId
        const conversationId = data.history.conversationId || 
                             data.messages[0]?.conversationId ||
                             Date.now().toString();

        // Normalize history data
        data.history = {
            title: data.history.title || 'Untitled Conversation',
            timestamp: data.history.timestamp || Date.now().toString(),
            created: data.history.created || Date.now().toString(),
            updated: data.history.updated || Date.now().toString(),
            conversationId: conversationId,
            personas: data.history.personas || [],
            readonly: data.history.readonly ?? false,
            messageLog: data.history.messageLog || {
                added: [],
                deleted: [],
                lastSyncedMessageCount: data.messages?.length || 0
            },
            // Preserve any additional history fields
            ...data.history
        };

        // Normalize messages
        data.messages = data.messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: msg.timestamp || Date.now().toString(),
            conversationId: msg.conversationId || conversationId,
            // Preserve existing message fields
            ...msg
        }));

        // Add standard fields if missing
        const normalized = {
            history: data.history,
            messages: data.messages,
            changeType: data.changeType || 'update',
            version: data.version || 1,
            timestamp: data.timestamp || Date.now(),
            vectorClock: data.vectorClock || {},
            // Preserve any additional fields
            ...data
        };

        // Log normalization changes
        if (JSON.stringify(data) !== JSON.stringify(normalized)) {
            logger.info('[iCloudService] Conversation data normalized:', {
                added: Object.keys(normalized).filter(k => !data.hasOwnProperty(k)),
                modified: Object.keys(data).filter(k => 
                    JSON.stringify(data[k]) !== JSON.stringify(normalized[k])
                )
            });
            Object.assign(data, normalized);
        }

        return normalized;
    } catch (error) {
        logger.error('[iCloudService] Conversation validation error:', {
            error: String(error),
            stack: error?.stack,
            data: data ? {
                hasHistory: !!data.history,
                hasMessages: !!data.messages,
                messageCount: data.messages?.length
            } : 'null'
        });
        throw error;
    }
};

/**
 * Validate and normalize image data
 */
export const validateImage = (value) => {
    try {
        logger.debug('[iCloudService] Validating image:', {
            type: value?.constructor?.name,
            size: value instanceof Blob ? value.size : value?.byteLength,
            hasData: !!value
        });

        if (!value) {
            throw new Error('Image data is required');
        }

        // Convert ArrayBuffer to Blob if needed
        if (value instanceof ArrayBuffer) {
            const blob = new Blob([value]);
            logger.debug('[iCloudService] Converted ArrayBuffer to Blob:', {
                originalSize: value.byteLength,
                newSize: blob.size
            });
            return blob;
        }

        // Verify it's a valid Blob
        if (!(value instanceof Blob)) {
            throw new Error(`Invalid image data type: ${value?.constructor?.name}. Expected Blob or ArrayBuffer.`);
        }

        // Verify we have valid binary data
        if (value.size === 0) {
            throw new Error('Image data is empty (zero bytes)');
        }

        return value;
    } catch (error) {
        logger.error('[iCloudService] Image validation error:', {
            error: String(error),
            stack: error?.stack,
            type: value?.constructor?.name
        });
        throw error;
    }
};
