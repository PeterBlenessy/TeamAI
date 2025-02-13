import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncImage, getImage, getChangedImages, cleanupImages } from '@/composables/cloudSync/images';
import { cloudSyncService } from '@/services/cloudSyncService';
import { createMockProvider } from './test-utils';

vi.mock('@/services/cloudSyncService');

describe('Images Handler', () => {
    const mockProvider = createMockProvider();

    beforeEach(() => {
        vi.clearAllMocks();
        cloudSyncService.getProvider = vi.fn().mockReturnValue(mockProvider);
    });

    describe('syncImage', () => {
        it('validates image data type', async () => {
            const invalidData = 'not-binary-data';
            await expect(syncImage('test-id', invalidData))
                .rejects.toThrow('Image data must be Blob or ArrayBuffer');
        });

        it('validates non-empty data', async () => {
            const emptyBlob = new Blob([]);
            await expect(syncImage('test-id', emptyBlob))
                .rejects.toThrow('Image data is empty');
        });

        it('successfully syncs blob data', async () => {
            const validBlob = new Blob(['test-data'], { type: 'image/png' });
            await syncImage('test-id', validBlob);
            expect(mockProvider.writeFile).toHaveBeenCalledWith(
                '/mock/container/images/test-id',
                expect.any(Blob)
            );
        });

        it('converts ArrayBuffer to Blob', async () => {
            const buffer = new Uint8Array([1, 2, 3]).buffer;
            await syncImage('test-id', buffer);
            expect(mockProvider.writeFile).toHaveBeenCalledWith(
                '/mock/container/images/test-id',
                expect.any(Blob)
            );
        });
    });

    describe('getImage', () => {
        it('returns null for non-existent image', async () => {
            mockProvider.readFile.mockRejectedValue(new Error('no such file'));
            const result = await getImage('missing-id');
            expect(result).toBeNull();
        });

        it('returns raw image data when found', async () => {
            const mockData = new Blob(['test-image']);
            mockProvider.readFile.mockResolvedValue(mockData);

            const result = await getImage('test-id');
            expect(result).toEqual(mockData);
        });
    });

    describe('getChangedImages', () => {
        it('filters images by date when since is provided', async () => {
            const now = Date.now();
            mockProvider.listFiles.mockResolvedValue([
                { name: 'old.png', modifiedAt: now - 1000, size: 100 },
                { name: 'new.jpg', modifiedAt: now + 1000, size: 200 }
            ]);

            const changes = await getChangedImages(new Date(now));
            expect(changes).toHaveLength(1);
            expect(changes[0].id).toBe('new.jpg');
            expect(changes[0].size).toBe(200);
        });

        it('skips directories and hidden files', async () => {
            mockProvider.listFiles.mockResolvedValue([
                { name: 'image.png', modifiedAt: Date.now(), isDirectory: false },
                { name: '.hidden.png', modifiedAt: Date.now(), isDirectory: false },
                { name: 'folder', modifiedAt: Date.now(), isDirectory: true }
            ]);

            const changes = await getChangedImages();
            expect(changes).toHaveLength(1);
            expect(changes[0].id).toBe('image.png');
        });
    });

    describe('cleanupImages', () => {
        it('removes unreferenced images', async () => {
            mockProvider.listFiles.mockResolvedValue([
                { name: 'keep.png' },
                { name: 'delete.png' }
            ]);

            await cleanupImages(['keep.png']);
            
            expect(mockProvider.deleteFile).toHaveBeenCalledTimes(1);
            expect(mockProvider.deleteFile).toHaveBeenCalledWith(
                '/mock/container/images/delete.png'
            );
        });

        it('handles errors during cleanup', async () => {
            mockProvider.listFiles.mockResolvedValue([{ name: 'test.png' }]);
            mockProvider.deleteFile.mockRejectedValue(new Error('Delete failed'));

            // Should not throw
            await expect(cleanupImages([])).resolves.not.toThrow();
        });
    });
});