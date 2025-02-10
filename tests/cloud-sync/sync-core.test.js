import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSync, SyncPhase } from '@/composables/cloud-sync/create-sync';

// Mock logger
vi.mock('@/services/logger', () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

function createMockProvider() {
    return {
        isAvailable: vi.fn().mockReturnValue(true),
        validateConnection: vi.fn().mockResolvedValue(true)
    };
}

describe('Sync Core', () => {
    const mockProvider = createMockProvider();
    const mockHandler = {
        enabled: vi.fn().mockReturnValue(true),
        getChanges: vi.fn().mockResolvedValue([]),
        getPendingUploads: vi.fn().mockResolvedValue([]),
        sync: vi.fn().mockResolvedValue(true),
        applyChange: vi.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires a provider', () => {
        expect(() => createSync()).toThrow('Provider is required');
    });

    describe('Progress Tracking', () => {
        it('tracks progress through both refs and events', async () => {
            const sync = createSync(mockProvider);
            sync.registerHandler('test', mockHandler);

            // Track progress via events
            const progressUpdates = [];
            const unsubscribe = sync.progress.onProgress((update) => {
                progressUpdates.push({ ...update });
            });

            // Set up test data
            const items = [
                { id: '1', data: 'test1' },
                { id: '2', data: 'test2' }
            ];
            mockHandler.getPendingUploads.mockResolvedValue(items);

            await sync.sync();

            // Verify ref-based updates
            expect(sync.progress.phase.value).toBe(SyncPhase.IDLE);
            expect(sync.progress.totalProgress.value).toBe(1);
            
            // Verify event-based updates
            expect(progressUpdates).toContainEqual(
                expect.objectContaining({
                    phase: SyncPhase.CHECK,
                    totalProgress: expect.any(Number)
                })
            );
            expect(progressUpdates).toContainEqual(
                expect.objectContaining({
                    phase: SyncPhase.UPLOAD,
                    currentItem: expect.objectContaining({
                        count: 2,
                        total: 2
                    })
                })
            );

            unsubscribe();
        });

        it('notifies progress listeners of item-level updates', async () => {
            const sync = createSync(mockProvider);
            sync.registerHandler('test', mockHandler);

            const items = [
                { id: '1', data: 'test1' },
                { id: '2', data: 'test2' }
            ];
            mockHandler.getPendingUploads.mockResolvedValue(items);

            // Create a promise that resolves on first item progress
            let firstItemUpdate;
            const progressPromise = new Promise(resolve => {
                firstItemUpdate = resolve;
            });

            const unsubscribe = sync.progress.onProgress((update) => {
                if (update.currentItem?.count === 1) {
                    firstItemUpdate(update);
                }
            });

            // Start sync but don't await it
            const syncPromise = sync.sync();
            
            // Wait for first progress update
            const progress = await progressPromise;
            expect(progress.currentItem).toEqual(
                expect.objectContaining({
                    count: 1,
                    total: 2
                })
            );

            await syncPromise;
            unsubscribe();
        });

        it('maintains correct progress state after errors', async () => {
            const sync = createSync(mockProvider);
            sync.registerHandler('test', mockHandler);

            const items = [
                { id: '1', data: 'test1' },
                { id: '2', data: 'test2' }
            ];
            mockHandler.getPendingUploads.mockResolvedValue(items);
            mockHandler.sync
                .mockResolvedValueOnce(true)
                .mockRejectedValueOnce(new Error('Test error'));

            const progressUpdates = [];
            const unsubscribe = sync.progress.onProgress((update) => {
                progressUpdates.push({ ...update });
            });

            await sync.sync();

            // Verify final state reflects error
            expect(sync.progress.phase.value).toBe(SyncPhase.ERROR);
            expect(sync.errors.value).toHaveLength(1);

            // Verify progress was tracked up to error
            const lastValidProgress = progressUpdates
                .filter(p => p.phase === SyncPhase.UPLOAD)
                .pop();
            expect(lastValidProgress?.currentItem).toEqual(
                expect.objectContaining({
                    count: 1,
                    total: 2
                })
            );

            unsubscribe();
        });
    });
});