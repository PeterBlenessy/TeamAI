import { describe, it, expect, vi } from 'vitest';
import { createProvider } from '@/services/cloud-storage/create-provider';
import { CloudError, ValidationError } from '@/services/cloud-storage/types';

describe('Cloud Storage Provider Factory', () => {
    it('validates required methods', () => {
        const invalidImplementation = {};
        expect(() => createProvider(invalidImplementation))
            .toThrow(ValidationError);
    });

    it('adds error handling to methods', async () => {
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

        const provider = createProvider(mockImplementation);
        mockImplementation.readFile.mockRejectedValue(new Error('test error'));
        
        await expect(provider.readFile('test.txt'))
            .rejects.toThrow(CloudError);
    });

    it('validates connection availability', async () => {
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

        mockImplementation.isAvailable.mockReturnValue(false);
        const provider = createProvider(mockImplementation);
        
        await expect(provider.validateConnection())
            .rejects.toThrow('Storage provider is not available');
    });
});