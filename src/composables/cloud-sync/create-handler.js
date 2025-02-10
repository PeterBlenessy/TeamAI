import logger from '@/services/logger';
import { CloudError, ValidationError } from '@/services/cloud-storage/types';

/**
 * Creates a base handler with improved validation and transform operations
 */
export function createHandler(options = {}) {
    const {
        type,
        transform = data => data,
        validate = () => true,
        compareItems = (local, remote) => JSON.stringify(local) !== JSON.stringify(remote),
        batchSize = 10,
        retryAttempts = 3
    } = options;

    if (!type) {
        throw new ValidationError('Handler type is required');
    }

    return {
        type,
        batchSize,
        retryAttempts,

        /**
         * Transforms data for storage with validation
         */
        async transform(data) {
            try {
                const transformed = await transform(data);
                if (!transformed) {
                    throw new ValidationError('Transform resulted in empty data');
                }
                return transformed;
            } catch (error) {
                throw new ValidationError(`Transform failed: ${error.message}`, {
                    cause: error,
                    type,
                    data
                });
            }
        },

        /**
         * Validates data structure with detailed feedback
         */
        async validate(data) {
            try {
                if (!data) {
                    throw new ValidationError('Data is required');
                }

                const result = await validate(data);
                if (!result) {
                    throw new ValidationError('Data validation failed');
                }

                return true;
            } catch (error) {
                throw new ValidationError(`Validation failed: ${error.message}`, {
                    cause: error,
                    type,
                    data
                });
            }
        },

        /**
         * Detects changes between items and determines sync direction
         * @returns {Object} { hasChanges: boolean, direction: 'upload'|'download'|null }
         */
        async detectChanges(localData, remoteData) {
            try {
                // Handle missing data cases
                if (!localData && !remoteData) return { hasChanges: false, direction: null };
                if (!localData) return { hasChanges: true, direction: 'download' };
                if (!remoteData) return { hasChanges: true, direction: 'upload' };

                // Check modification timestamps first
                if (localData.lastModified && remoteData.lastModified) {
                    const localDate = new Date(localData.lastModified);
                    const remoteDate = new Date(remoteData.lastModified);
                    
                    if (localDate > remoteDate) {
                        return { hasChanges: true, direction: 'upload' };
                    }
                    if (remoteDate > localDate) {
                        return { hasChanges: true, direction: 'download' };
                    }
                }

                // Check vector clocks if available
                if (localData.vectorClock && remoteData.vectorClock) {
                    if (localData.vectorClock.counter > remoteData.vectorClock.counter) {
                        return { hasChanges: true, direction: 'upload' };
                    }
                    if (remoteData.vectorClock.counter > localData.vectorClock.counter) {
                        return { hasChanges: true, direction: 'download' };
                    }
                }

                // Fall back to custom comparison
                const hasChanges = await compareItems(localData, remoteData);
                if (!hasChanges) {
                    return { hasChanges: false, direction: null };
                }

                // If content differs but no timestamp/vector clock info, 
                // we assume local changes should be uploaded
                logger.debug(`[CloudSync:${type}] Content differs but no timestamp/vector info, defaulting to upload`, {
                    local: localData,
                    remote: remoteData
                });
                return { hasChanges: true, direction: 'upload' };
            } catch (error) {
                logger.error(`[CloudSync:${type}] Change detection error:`, {
                    error: String(error),
                    stack: error?.stack
                });
                throw new CloudError(`Change detection failed: ${error.message}`, {
                    cause: error,
                    type,
                    localData,
                    remoteData
                });
            }
        },

        /**
         * Gets all changes that need to be synced
         */
        async getChanges(localData = [], remoteData = []) {
            const changes = [];
            const conflicts = [];

            try {
                // Find items that exist in either local or remote
                const allIds = new Set([
                    ...localData.map(item => item.id),
                    ...remoteData.map(item => item.id)
                ]);

                // Check each item for changes
                for (const id of allIds) {
                    const local = localData.find(item => item.id === id);
                    const remote = remoteData.find(item => item.id === id);
                    
                    const { hasChanges, direction } = await this.detectChanges(local, remote);
                    
                    if (hasChanges) {
                        changes.push({
                            type: direction,
                            data: direction === 'upload' ? local : remote,
                            reason: !local || !remote ? 'new' : 'modified'
                        });
                    }
                }

                if (conflicts.length > 0) {
                    logger.warn(`[CloudSync:${type}] Detected conflicts:`, conflicts);
                }

                return { changes, conflicts };
            } catch (error) {
                throw new CloudError(`Failed to get changes: ${error.message}`, {
                    cause: error,
                    type
                });
            }
        },

        /**
         * Processes items in batches
         */
        async processBatch(items, processor) {
            const results = [];
            
            for (let i = 0; i < items.length; i += this.batchSize) {
                const batch = items.slice(i, i + this.batchSize);
                const batchResults = await Promise.allSettled(
                    batch.map(item => processor(item))
                );
                
                results.push(...batchResults);
            }
            
            return results;
        },

        /**
         * Retries an operation with exponential backoff
         */
        async retry(operation, description) {
            for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
                try {
                    logger.debug(`[CloudSync:${type}] Attempting ${description} (${attempt}/${this.retryAttempts})`);
                    const result = await operation();
                    logger.debug(`[CloudSync:${type}] Successfully completed ${description}`);
                    return result;
                } catch (error) {
                    if (attempt === this.retryAttempts) throw error;
                    logger.warn(`[CloudSync:${type}] Failed ${description} (attempt ${attempt}/${this.retryAttempts}):`, 
                        String(error)
                    );
                    await new Promise(resolve => 
                        setTimeout(resolve, Math.pow(2, attempt) * 1000)
                    );
                }
            }
        }
    };
}