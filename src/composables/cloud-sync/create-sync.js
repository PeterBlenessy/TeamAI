import { ref, readonly } from 'vue';
import logger from '@/services/logger';
import { CloudError } from '@/services/cloud-storage/types';

export const SyncPhase = {
    IDLE: 'idle',
    CHECK: 'check',
    UPLOAD: 'upload',
    DOWNLOAD: 'download',
    ERROR: 'error',
    RECOVERY: 'recovery'
};

function createProgress() {
    const state = {
        phase: ref(SyncPhase.IDLE),
        phaseProgress: ref(0),
        totalProgress: ref(0),
        currentItem: ref(null),
        errors: ref([]),
        recoveryAttempts: ref(0)
    };

    const listeners = new Set();

    function notify() {
        const update = {
            phase: state.phase.value,
            phaseProgress: state.phaseProgress.value,
            totalProgress: state.totalProgress.value,
            currentItem: state.currentItem.value
        };
        listeners.forEach(listener => listener(update));
    }

    return {
        // Public refs - maintain .value access for tests
        phase: state.phase,
        phaseProgress: state.phaseProgress,
        totalProgress: state.totalProgress,
        currentItem: state.currentItem,
        errors: readonly(state.errors), // Make errors readonly but accessible

        // Internal mutation methods
        _update: {
            setPhase(phase) {
                state.phase.value = phase;
                notify();
            },
            setProgress(phase, current, total) {
                state.phaseProgress.value = total > 0 ? current / total : 0;
                state.currentItem.value = { phase, count: current, total };
                notify();
            },
            setTotalProgress(progress) {
                state.totalProgress.value = progress;
                notify();
            },
            addError(error) {
                // Only add the error if it's not already in the list
                const errorMessage = error?.message || String(error);
                if (!state.errors.value.some(e => e.message === errorMessage)) {
                    state.phase.value = SyncPhase.ERROR;
                    state.errors.value.push({
                        phase: state.phase.value,
                        message: errorMessage,
                        timestamp: new Date(),
                        error
                    });
                    notify();
                }
            },
            reset() {
                state.phase.value = SyncPhase.IDLE;
                state.phaseProgress.value = 0;
                state.totalProgress.value = 1; // Set to 1 when complete
                state.currentItem.value = null;
                state.errors.value = [];
                notify();
            }
        },

        // Progress subscription
        onProgress(callback) {
            listeners.add(callback);
            return () => listeners.delete(callback);
        }
    };
}

export function createSync(provider) {
    if (!provider) {
        throw new Error('Provider is required');
    }

    const progress = createProgress();
    const handlers = new Map();

    async function processItems(type, items, processor) {
        if (!Array.isArray(items) || items.length === 0) {
            return { results: [], hasErrors: false };
        }

        const results = [];
        let processedCount = 0;
        let hasErrors = false;
        
        progress._update.setProgress(type, processedCount, items.length);
        
        for (const item of items) {
            try {
                const result = await processor(item);
                if (result) results.push(result);
                // Only increment count for successful items
                processedCount++;
                progress._update.setProgress(type, processedCount, items.length);
            } catch (error) {
                hasErrors = true;
                // Don't increment count for failed items
                break; // Stop processing on first error
            }
        }
        
        return { results, hasErrors };
    }

    async function executePhase(phase) {
        progress._update.setPhase(phase.name);
        try {
            await phase.fn();
            return true;
        } catch (error) {
            progress._update.addError(error);
            return false;
        }
    }

    return {
        progress,
        errors: progress.errors, // Expose errors directly for easier access
        onProgress: progress.onProgress,

        registerHandler(type, handler) {
            if (!type || !handler) {
                throw new Error('Handler registration requires type and implementation');
            }
            handlers.set(type, handler);
        },

        async sync() {
            if (!provider.isAvailable()) {
                progress._update.addError(new Error('Provider is not available'));
                return;
            }

            progress._update.reset();
            progress._update.setTotalProgress(0); // Start at 0
            
            const phases = [
                { 
                    name: SyncPhase.CHECK,
                    fn: async () => {
                        for (const [type, handler] of handlers.entries()) {
                            if (!handler.enabled()) continue;
                            
                            const changes = await handler.getChanges();
                            if (changes?.length > 0) {
                                const { hasErrors } = await processItems(type, changes, change => handler.applyChange(change));
                                if (hasErrors) {
                                    throw new Error('Failed to apply changes');
                                }
                            }
                        }
                    }
                },
                { 
                    name: SyncPhase.UPLOAD,
                    fn: async () => {
                        let uploadError = null;
                        for (const [type, handler] of handlers.entries()) {
                            if (!handler.enabled()) continue;
                            
                            try {
                                const items = await handler.getPendingUploads() || [];
                                if (items.length > 0) {
                                    const result = await processItems(type, items, item => handler.sync(item.id, item.data));
                                    if (result.hasErrors && !uploadError) {
                                        uploadError = new Error(`Failed to upload ${type} items`);
                                    }
                                }
                            } catch (error) {
                                if (!uploadError) uploadError = error;
                            }
                        }
                        if (uploadError) throw uploadError;
                    }
                }
            ];

            let succeeded = true;
            for (let i = 0; i < phases.length; i++) {
                const phaseSuccess = await executePhase(phases[i]);
                if (!phaseSuccess) {
                    succeeded = false;
                    break;
                }
                progress._update.setTotalProgress((i + 1) / phases.length);
            }

            if (succeeded) {
                progress._update.reset(); // This will set totalProgress to 1
            }
        }
    };
}