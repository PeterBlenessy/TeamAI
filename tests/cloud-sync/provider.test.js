import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProvider } from '../../src/services/cloud-storage/create-provider';
import { CloudError, ValidationError } from '../../src/services/cloud-storage/types';

// Mock logger
vi.mock('@/services/logger', () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('Cloud Storage Provider Factory', () => {
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

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates required methods', () => {
        expect(() => createProvider(mockImplementation)).not.toThrow();
        expect(() => createProvider({})).toThrow(ValidationError);
    });

    it('adds error handling to methods', async () => {
        const error = new Error('Test error');
        mockImplementation.readFile.mockRejectedValue(error);

        const provider = createProvider(mockImplementation);
        await expect(provider.readFile('test.txt')).rejects.toThrow(CloudError);
    });

    it('provides retry functionality', async () => {
        const provider = createProvider(mockImplementation);
        const operation = vi.fn()
            .mockRejectedValueOnce(new Error('First failure'))
            .mockResolvedValueOnce('success');

        const result = await provider.retry(operation, 'test operation');
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
    });

    it('handles connection validation', async () => {
        mockImplementation.isAvailable.mockResolvedValue(false);
        const provider = createProvider(mockImplementation);
        await expect(provider.validateConnection()).rejects.toThrow('not available');
    });
});