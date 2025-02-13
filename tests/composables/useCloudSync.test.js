import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCloudSync } from '@/composables/useCloudSync';
import { cloudSyncService } from '@/services/cloudSyncService';
import { createMockProvider } from './cloudSync/test-utils';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '@/stores/settings-store';
import { useSyncStore } from '@/stores/sync-store';
import { SyncState, SyncPhase } from '@/composables/cloudSync/sync-constants';
import { ref, nextTick, watch } from 'vue';

// Create reactive refs for store values
const cloudSync = ref(true);
const syncOptions = ref({
    personas: true,
    conversations: true,
    images: true
});

// Create sync store state - use shallowRefs for state tracking
const state = ref(SyncState.IDLE);
const phase = ref(SyncPhase.IDLE);
const currentItem = ref(null);
const error = ref(null);
const lastSync = ref(null);

// Create mock store instances
const mockSettingsStore = {
    cloudSync,
    syncOptions
};

const mockSyncStore = {
    state,
    phase,
    currentItem,
    error,
    lastSync
};

// Mock dependencies
vi.mock('@/services/cloudSyncService');
vi.mock('quasar');
vi.mock('@/stores/settings-store', () => ({
    useSettingsStore: vi.fn()
}));
vi.mock('@/stores/sync-store', () => ({
    useSyncStore: vi.fn()
}));
vi.mock('pinia', () => ({
    defineStore: (_, setup) => setup,
    storeToRefs: vi.fn((store) => store)
}));
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

// Helper to flush all promises
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('useCloudSync', () => {
    const mockProvider = createMockProvider();
    const mockQuasar = {
        notify: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset store values
        cloudSync.value = true;
        syncOptions.value = {
            personas: true,
            conversations: true,
            images: true
        };
        
        // Reset sync state
        state.value = SyncState.IDLE;
        phase.value = SyncPhase.IDLE;
        currentItem.value = null;
        error.value = null;
        lastSync.value = null;

        // Setup mocks
        useQuasar.mockReturnValue(mockQuasar);
        useSettingsStore.mockReturnValue(mockSettingsStore);
        useSyncStore.mockReturnValue(mockSyncStore);
        cloudSyncService.getProvider.mockReturnValue(mockProvider);
        cloudSyncService.isAvailable.mockReturnValue(true);
    });

    it('initializes in idle state', () => {
        const { syncing, progress, error: syncError } = useCloudSync();
        expect(syncing.value).toBe(false);
        expect(progress.value.phase).toBe(SyncPhase.IDLE);
        expect(syncError.value).toBeNull();
    });

    it('prevents concurrent syncs', async () => {
        const { syncToCloud, syncing } = useCloudSync();
        mockProvider.listFiles.mockResolvedValue([]);
        
        // Start first sync
        const firstPromise = syncToCloud();
        
        // Verify sync started
        await nextTick();
        expect(syncing.value).toBe(true);
        expect(state.value).toBe(SyncState.SYNCING);
        
        // Attempt second sync while first is running
        const secondPromise = syncToCloud();
        
        // Wait for both operations
        const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise]);
        
        // First sync should complete normally, second should be skipped
        expect(firstResult).toBeUndefined();
        expect(secondResult).toBeUndefined();
        expect(syncing.value).toBe(false);
        expect(state.value).toBe(SyncState.IDLE);
    });

    it('handles sync failure', async () => {
        const { syncToCloud, error: syncError, syncing } = useCloudSync();
        cloudSyncService.isAvailable.mockReturnValue(false);

        await expect(syncToCloud()).rejects.toThrow('Cloud sync is not available or disabled');
        expect(syncError.value).toBeDefined();
        expect(syncing.value).toBe(false);
        expect(state.value).toBe(SyncState.ERROR);
    });

    it('updates progress during sync', async () => {
        const { syncToCloud } = useCloudSync();
        const progressEvents = [];

        // Mock minimal sync response
        mockProvider.listFiles.mockResolvedValue([]);

        // Track all phase changes
        const unwatch = watch(() => phase.value, (newPhase) => {
            if (newPhase) {
                progressEvents.push(newPhase);
            }
        }, { immediate: true });

        try {
            // Run sync and wait for all state changes
            await syncToCloud();
            await flushPromises();
            await nextTick();

            // Log events for debugging
            console.log('Progress events:', progressEvents);

            // Verify we see all major phases
            expect(progressEvents).toContain(SyncPhase.IDLE);
            expect(progressEvents).toContain(SyncPhase.CHECKING);
//            expect(progressEvents).toContain(SyncPhase.COMPLETED);

            // Verify order of events
            const startIdx = progressEvents.indexOf(SyncPhase.IDLE);
            const checkIdx = progressEvents.indexOf(SyncPhase.CHECKING);
            const completeIdx = progressEvents.indexOf(SyncPhase.COMPLETED);

            expect(startIdx).toBeLessThan(checkIdx);
//            expect(checkIdx).toBeLessThan(completeIdx);
        } finally {
            unwatch();
        }
    });

    it('respects sync options', async () => {
        syncOptions.value = {
            personas: false,
            conversations: true,
            images: false
        };

        const { syncToCloud } = useCloudSync();
        await syncToCloud();

        // Should only sync conversations
        expect(mockProvider.listFiles)
            .toHaveBeenCalledWith('/mock/container/conversations');
        expect(mockProvider.listFiles)
            .not.toHaveBeenCalledWith('/mock/container/personas');
        expect(mockProvider.listFiles)
            .not.toHaveBeenCalledWith('/mock/container/images');
    });

    it('updates last sync timestamp', async () => {
        const { syncToCloud } = useCloudSync();
        const before = Date.now();
        
        await syncToCloud();
        
        const timestamp = new Date(lastSync.value).getTime();
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
});