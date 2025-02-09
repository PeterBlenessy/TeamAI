import { describe, it, expect, vi } from 'vitest';
import { createProvider } from '../src/services/cloud-storage/create-provider';
import { baseOperations } from '../src/services/cloud-storage/base-operations';
import { createSync } from '../src/composables/cloud-sync/create-sync';
import { createHandler } from '../src/composables/cloud-sync/create-handler';

describe('Cloud Storage Provider', () => {
    const mockImplementation = {
        init: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        createDir: vi.fn(),
        listChanges: vi.fn(),
        isAvailable: vi.fn(),
        getMetadata: vi.fn()
    };

    it('should validate provider implementation', () => {
        expect(() => createProvider(mockImplementation)).not.toThrow();
        expect(() => createProvider({})).toThrow();
    });
});

describe('Base Operations', () => {
    const mockProvider = {
        ...baseOperations,
        listFiles: vi.fn(),
        createDir: vi.fn(),
        writeFile: vi.fn()
    };

    it('should ensure directory exists', async () => {
        mockProvider.listFiles.mockResolvedValue(false);
        await mockProvider.ensureDir('test/path');
        expect(mockProvider.createDir).toHaveBeenCalledWith('test/path');
    });
});

describe('Sync Core', () => {
    const mockProvider = {
        validateConnection: vi.fn(),
        isAvailable: vi.fn().mockReturnValue(true)
    };

    it('should initialize with provider', () => {
        expect(() => createSync(mockProvider)).not.toThrow();
        expect(() => createSync()).toThrow();
    });

    it('should track progress correctly', async () => {
        const sync = createSync(mockProvider);
        expect(sync.progress.phase.value).toBe('idle');
        expect(sync.progress.totalProgress.value).toBe(0);
    });
});

describe('Handler Factory', () => {
    it('should require handler type', () => {
        expect(() => createHandler()).toThrow();
        expect(() => createHandler({ type: 'test' })).not.toThrow();
    });

    it('should detect changes correctly', async () => {
        const handler = createHandler({ type: 'test' });
        const changes = await handler.getChanges(
            [{ id: 1, data: 'local' }],
            [{ id: 2, data: 'remote' }]
        );
        expect(changes).toHaveLength(2); // One upload, one download
    });
});