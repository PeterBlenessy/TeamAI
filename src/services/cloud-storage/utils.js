import logger from '@/services/logger';

export class CloudStorageError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'CloudStorageError';
        this.details = details;
    }
}

export class ValidationError extends CloudStorageError {
    constructor(message, details = {}) {
        super(message, details);
        this.name = 'ValidationError';
    }
}

export class ConnectionError extends CloudStorageError {
    constructor(message, details = {}) {
        super(message, details);
        this.name = 'ConnectionError';
    }
}

/**
 * Wraps an async operation with timing and error logging
 */
export async function withErrorHandling(operation, context) {
    const startTime = Date.now();
    try {
        const result = await operation();
        const duration = Date.now() - startTime;
        
        logger.debug('[CloudStorage] Operation completed:', {
            context,
            durationMs: duration
        });
        
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('[CloudStorage] Operation failed:', {
            context,
            error: String(error),
            stack: error?.stack,
            durationMs: duration
        });
        
        if (error instanceof CloudStorageError) {
            throw error;
        }
        
        throw new CloudStorageError(`Operation failed: ${context}`, {
            cause: error,
            context
        });
    }
}

/**
 * Formats a file size for display
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generates a vector clock timestamp
 */
export function getVectorClock(clientId) {
    return {
        timestamp: new Date().toISOString(),
        client: clientId,
        counter: Date.now()
    };
}