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

const syncMethods = ['isAvailable'];

/**
 * Creates a storage provider with validation and error logging
 */
export function createProvider(implementation) {
    // Validate implementation has all required methods
    const missing = Object.keys(requiredMethods).filter(
        method => typeof implementation[method] !== 'function'
    );

    if (missing.length > 0) {
        throw new ValidationError('Invalid provider implementation', {
            missing,
            required: Object.keys(requiredMethods)
        });
    }

    // Add error logging wrapper for async methods
    const withErrorLogging = (fn, name) => async (...args) => {
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

    // Add sync error logging wrapper
    const withSyncErrorLogging = (fn, name) => (...args) => {
        try {
            return fn.apply(implementation, args);
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

    // Wrap methods with appropriate error logging
    const wrapped = Object.keys(requiredMethods).reduce((acc, method) => ({
        ...acc,
        [method]: syncMethods.includes(method) 
            ? withSyncErrorLogging(implementation[method], method)
            : withErrorLogging(implementation[method], method)
    }), {});

    return {
        ...wrapped,
        
        async validateConnection() {
            if (!this.isAvailable()) {
                throw new CloudError('Storage provider is not available');
            }
        },

        async ensureInitialized() {
            if (!this._initialized) {
                await this.init();
                this._initialized = true;
            }
        }
    };
}