import { ref, computed } from 'vue';
import logger from '@/services/logger';

export const SyncPhase = {
    IDLE: 'idle',
    CHECK: 'check',
    UPLOAD: 'upload',
    DOWNLOAD: 'download'
};

/**
 * Creates progress tracking state
 */
function createProgress() {
    const phase = ref(SyncPhase.IDLE);
    const phaseProgress = ref(0);
    const totalProgress = ref(0);
    const currentItem = ref(null);
    
    return {
        phase,
        phaseProgress,
        totalProgress,
        currentItem,
        
        // Computed status for UI
        status: computed(() => {
            if (phase.value === SyncPhase.IDLE) return '';
            
            const progress = Math.round(totalProgress.value * 100);
            const item = currentItem.value;
            
            if (item) {
                return `${phase.value}: ${item.type} ${item.count}/${item.total} (${progress}%)`;
            }
            return `${phase.value} (${progress}%)`;
        })
    };
}

/**
 * Creates core sync functionality
 */
export function createSync(provider, options = {}) {
    if (!provider) {
        throw new Error('Provider is required');
    }

    // Initialize state
    const progress = createProgress();
    const errors = ref([]);
    const handlers = new Map();

    /**
     * Updates progress for current operation
     */
    function updateProgress(count, total) {
        if (progress.currentItem.value) {
            progress.currentItem.value.count = count;
            progress.currentItem.value.total = total;
        }
        progress.phaseProgress.value = total > 0 ? count / total : 0;
    }

    /**
     * Starts tracking progress for an operation
     */
    function trackOperation(type, total) {
        progress.currentItem.value = {
            type,
            count: 0,
            total
        };
        updateProgress(0, total);
    }

    /**
     * Records an error that occurred during sync
     */
    function recordError(phase, error, item = null) {
        const errorInfo = {
            phase,
            message: String(error),
            timestamp: new Date(),
            item
        };
        
        errors.value.push(errorInfo);
        logger.error('[CloudSync] Error during sync:', errorInfo);
    }

    return {
        // Public state
        progress: progress,
        errors: errors,

        // Handler registration
        registerHandler(type, handler) {
            handlers.set(type, handler);
        },

        // Core sync functionality
        async sync() {
            try {
                await provider.validateConnection();
                
                const phases = [
                    { name: SyncPhase.CHECK, fn: this.checkChanges },
                    { name: SyncPhase.UPLOAD, fn: this.uploadChanges },
                    { name: SyncPhase.DOWNLOAD, fn: this.downloadChanges }
                ];

                // Reset state
                errors.value = [];
                
                // Execute phases
                for (const [index, phase] of phases.entries()) {
                    progress.phase.value = phase.name;
                    await phase.fn.call(this);
                    progress.totalProgress.value = (index + 1) / phases.length;
                }

                progress.phase.value = SyncPhase.IDLE;
                
            } catch (error) {
                recordError(progress.phase.value, error);
                throw error;
            }
        },

        // Individual phase implementations
        async checkChanges() {
            try {
                for (const [type, handler] of handlers.entries()) {
                    if (!handler.enabled?.()) continue;

                    trackOperation(type, 1);
                    const changes = await handler.getChanges();
                    
                    if (changes?.length > 0) {
                        logger.debug(`[CloudSync] Found ${changes.length} changes for ${type}`);
                    }
                    
                    updateProgress(1, 1);
                }
            } catch (error) {
                recordError(SyncPhase.CHECK, error);
                throw error;
            }
        },

        async uploadChanges() {
            try {
                for (const [type, handler] of handlers.entries()) {
                    if (!handler.enabled?.()) continue;

                    const items = await handler.getPendingUploads?.();
                    if (!items?.length) continue;

                    trackOperation(type, items.length);
                    
                    for (const [index, item] of items.entries()) {
                        try {
                            await handler.sync(item.id, item.data, item.changeType);
                            updateProgress(index + 1, items.length);
                        } catch (error) {
                            recordError(SyncPhase.UPLOAD, error, item);
                            // Continue with other items
                        }
                    }
                }
            } catch (error) {
                recordError(SyncPhase.UPLOAD, error);
                throw error;
            }
        },

        async downloadChanges() {
            try {
                for (const [type, handler] of handlers.entries()) {
                    if (!handler.enabled?.()) continue;

                    const changes = await handler.getChanges();
                    if (!changes?.length) continue;

                    trackOperation(type, changes.length);
                    
                    for (const [index, change] of changes.entries()) {
                        try {
                            await handler.applyChange(change);
                            updateProgress(index + 1, changes.length);
                        } catch (error) {
                            recordError(SyncPhase.DOWNLOAD, error, change);
                            // Continue with other changes
                        }
                    }
                }
            } catch (error) {
                recordError(SyncPhase.DOWNLOAD, error);
                throw error;
            }
        }
    };
}