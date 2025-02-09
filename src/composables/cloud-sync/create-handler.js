import logger from '@/services/logger';

/**
 * Creates a base handler with default implementations
 */
export function createHandler(options = {}) {
    const {
        type,
        transform = data => data,
        validate = () => true,
        compareItems = (local, remote) => JSON.stringify(local) !== JSON.stringify(remote)
    } = options;

    if (!type) {
        throw new Error('Handler type is required');
    }

    return {
        type,

        /**
         * Transforms data for storage
         */
        async transform(data) {
            try {
                return await transform(data);
            } catch (error) {
                logger.error(`[CloudSync:${type}] Transform error:`, {
                    error: String(error),
                    stack: error?.stack
                });
                throw error;
            }
        },

        /**
         * Validates data structure
         */
        async validate(data) {
            try {
                return await validate(data);
            } catch (error) {
                logger.error(`[CloudSync:${type}] Validation error:`, {
                    error: String(error),
                    stack: error?.stack
                });
                throw error;
            }
        },

        /**
         * Detects changes between items
         */
        async detectChanges(localData, remoteData) {
            try {
                // Skip comparison if one side is missing
                if (!localData || !remoteData) {
                    return true;
                }

                return await compareItems(localData, remoteData);
            } catch (error) {
                logger.error(`[CloudSync:${type}] Change detection error:`, {
                    error: String(error),
                    stack: error?.stack
                });
                throw error;
            }
        },

        /**
         * Gets all changes that need to be synced
         */
        async getChanges(localData = [], remoteData = []) {
            const changes = [];

            try {
                // Find items to upload (new or modified local items)
                for (const local of localData) {
                    const remote = remoteData.find(r => r.id === local.id);
                    if (!remote || await this.detectChanges(local, remote)) {
                        changes.push({
                            type: 'upload',
                            data: local
                        });
                    }
                }

                // Find items to download (new remote items)
                for (const remote of remoteData) {
                    const local = localData.find(l => l.id === remote.id);
                    if (!local) {
                        changes.push({
                            type: 'download',
                            data: remote
                        });
                    }
                }

                return changes;
            } catch (error) {
                logger.error(`[CloudSync:${type}] Get changes error:`, {
                    error: String(error),
                    stack: error?.stack
                });
                throw error;
            }
        }
    };
}