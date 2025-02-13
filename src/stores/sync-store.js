import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import storage from '@/services/localStorage.js';
import { SyncState, SyncPhase } from '@/composables/cloudSync/sync-constants';

export { SyncState, SyncPhase };

export const useSyncStore = defineStore('sync', () => {
    // Sync state tracking
    const state = ref(SyncState.IDLE);
    const phase = ref(SyncPhase.IDLE);
    const currentItem = ref(null);
    const error = ref(null);
    const lastSync = ref(storage.getItem('lastSync') || null);

    // Watch lastSync changes to persist to storage
    watch(lastSync, (newValue) => {
        storage.setItem('lastSync', newValue);
    });

    return {
        // State
        state,
        phase,
        currentItem,
        error,
        lastSync
    };
});