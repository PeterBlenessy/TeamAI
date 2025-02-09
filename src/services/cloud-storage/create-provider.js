import logger from '@/services/logger';
import { CloudError, ValidationError } from './types';

/**
 * @typedef {Object} FileMetadata
 * @property {Date} modified
 * @property {number} size
 * @property {'file'|'directory'} type
 */

/**
 * @typedef {Object} Change
 * @property {string} path
 * @property {'added'|'modified'|'deleted'} type
 * @property {Date} timestamp
 */

const requiredMethods = {
    init: async () => {},
    readFile: async (path) => {},
    writeFile: async (path, data) => {},
    deleteFile: async (path) => {},
    listFiles: async (dirPath) => {},
    createDir: async (path) => {},
    listChanges: async (since) => {},
    isAvailable: () => {},
    getMetadata: async (path) => {}
};

/**
 * Validates that all required methods are implemented
 */
function validateImplementation(implementation) {
    const missing = Object.keys(requiredMethods).filter(
        method => typeof implementation[method] !== 'function'
    );

    if (missing.length > 0) {
        throw new ValidationError('Invalid provider implementation', {
            missing,
            required: Object.keys(requiredMethods)
        });
    }
}

/**
 * Creates a storage provider with validated interface and error handling
 */
export function createProvider(implementation, options = {}) {
    try {
        validateImplementation(implementation);
        
        // Add error handling wrapper
        const withErrorHandling = (fn, name) => async (...args) => {
            try {
                return await fn.apply(implementation, args);
            } catch (error) {
                logger.error(`[CloudStorage] ${name} failed:`, {
                    args,
                    error: String(error),
                    stack: error?.stack
                });
                throw error instanceof CloudError ? error : 
                    new CloudError(`Provider operation failed: ${name}`, {
                        cause: error,
                        operation: name,
                        args
                    });
            }
        };

        // Wrap all methods with error handling
        const wrapped = Object.keys(requiredMethods).reduce((acc, method) => ({
            ...acc,
            [method]: withErrorHandling(implementation[method], method)
        }), {});
        
        return {
            ...wrapped,
            
            // Add common utilities
            async validateConnection() {
                if (!await this.isAvailable()) {
                    throw new CloudError('Storage provider is not available');
                }
            },

            async ensureInitialized() {
                if (!this._initialized) {
                    await this.init();
                    this._initialized = true;
                }
            },

            // Add retry utility
            async retry(operation, description, maxAttempts = options.retryAttempts || 3) {
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        logger.debug(`[CloudStorage] Attempting ${description} (${attempt}/${maxAttempts})`);
                        const result = await operation();
                        logger.debug(`[CloudStorage] Successfully completed ${description}`);
                        return result;
                    } catch (error) {
                        if (attempt === maxAttempts) throw error;
                        logger.warn(`[CloudStorage] Failed ${description} (attempt ${attempt}/${maxAttempts}):`, 
                            String(error)
                        );
                        await new Promise(resolve => 
                            setTimeout(resolve, (options.retryDelay || 1000) * attempt)
                        );
                    }
                }
            }
        };
    } catch (error) {
        logger.error('[CloudStorage] Provider creation failed:', {
            error: String(error),
            stack: error?.stack
        });
        throw error;
    }
}