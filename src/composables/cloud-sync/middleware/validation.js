import logger from '@/services/logger';

const validatePersona = (data) => {
    if (!data?.id) {
        throw new Error('Persona must have an id');
    }

    // Normalize and validate data
    const normalized = {
        id: data.id,
        name: data.name || 'Unnamed',
        prompt: data.prompt || '',
        readonly: data.readonly ?? true,
        lastModified: data.lastModified || Date.now(),
        ...data
    };

    return normalized;
};

const validateConversation = (data) => {
    // Ensure required arrays exist
    if (!data.messages) {
        data.messages = [];
    }

    if (!data.history) {
        data.history = {};
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
        ...data.history
    };

    // Normalize messages
    data.messages = data.messages.map(msg => ({
        role: msg.role || 'user',
        content: msg.content || '',
        timestamp: msg.timestamp || Date.now().toString(),
        conversationId: msg.conversationId || conversationId,
        ...msg
    }));

    return data;
};

const validateImageData = (value) => {
    if (!value) {
        throw new Error('Image data is required');
    }

    // Convert ArrayBuffer to Blob if needed
    if (value instanceof ArrayBuffer) {
        return new Blob([value]);
    }
    
    // Try to extract binary data if not already a Blob
    if (!(value instanceof Blob)) {
        const binaryData = value.data || value.buffer || value;
        if (binaryData instanceof ArrayBuffer) {
            return new Blob([binaryData]);
        }
        throw new Error(`Cannot convert ${value?.constructor?.name} to Blob`);
    }

    // Verify we have valid binary data
    if (value.size === 0) {
        throw new Error('Image data is empty');
    }

    return value;
};

/**
 * Adds data validation to a sync handler
 * @param {Object} handler - The sync handler to enhance
 * @param {string} type - The type of data to validate ('personas', 'conversations', or 'images')
 * @returns {Object} Handler with validation functionality
 */
export const withValidation = (handler, type) => ({
    ...handler,
    
    sync: async (itemId, data, changeType) => {
        try {
            let validatedData = data;
            
            switch (type) {
                case 'personas':
                    validatedData = validatePersona(data);
                    break;
                case 'conversations':
                    validatedData = validateConversation(data);
                    break;
                case 'images':
                    validatedData = validateImageData(data);
                    break;
                default:
                    logger.warn('[CloudSync] No validation defined for type:', type);
            }
            
            return handler.sync(itemId, validatedData, changeType);
        } catch (error) {
            logger.error('[CloudSync] Validation failed:', {
                type,
                itemId,
                error: String(error),
                stack: error?.stack
            });
            throw new Error(`Data validation failed: ${error.message}`);
        }
    }
});
