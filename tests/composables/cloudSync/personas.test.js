import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncPersona, getPersona, getChangedPersonas } from '@/composables/cloudSync/personas';
import { cloudSyncService } from '@/services/cloudSyncService';
import { createMockProvider, testData } from './test-utils';

vi.mock('@/services/cloudSyncService');

describe('Personas Handler', () => {
    const mockProvider = createMockProvider();

    beforeEach(() => {
        vi.clearAllMocks();
        cloudSyncService.getProvider = vi.fn().mockReturnValue(mockProvider);
    });

    describe('syncPersona', () => {
        it('validates required persona fields', async () => {
            const invalidData = { name: 'Test' }; // Missing id and prompt
            await expect(syncPersona('test-id', invalidData))
                .rejects.toThrow('Persona must have a string ID');

            const missingPrompt = { id: 'test', name: 'Test' };
            await expect(syncPersona('test-id', missingPrompt))
                .rejects.toThrow('Persona must have a string prompt');
        });

        it('successfully syncs valid persona', async () => {
            await syncPersona('test-id', testData.personas.valid);
            
            const writtenData = JSON.parse(mockProvider.writeFile.mock.calls[0][1]);
            expect(writtenData.data.readonly).toBe(false);
            expect(writtenData.data.id).toBe('test-persona');
        });

        it('preserves readonly flag if set', async () => {
            const readonlyPersona = { ...testData.personas.valid, readonly: true };
            await syncPersona('test-id', readonlyPersona);
            
            const writtenData = JSON.parse(mockProvider.writeFile.mock.calls[0][1]);
            expect(writtenData.data.readonly).toBe(true);
        });
    });

    describe('getPersona', () => {
        it('returns null for non-existent persona', async () => {
            mockProvider.readFile.mockRejectedValue(new Error('no such file'));
            const result = await getPersona('missing-id');
            expect(result).toBeNull();
        });

        it('returns persona data when found', async () => {
            const mockData = {
                lastModified: Date.now(),
                data: testData.personas.valid
            };
            mockProvider.readFile.mockResolvedValue(JSON.stringify(mockData));

            const result = await getPersona('test-id');
            expect(result).toEqual(testData.personas.valid);
        });
    });

    describe('getChangedPersonas', () => {
        it('filters personas by date when since is provided', async () => {
            const now = Date.now();
            mockProvider.listFiles.mockResolvedValue([
                { name: 'old.json', modifiedAt: now - 1000 },
                { name: 'new.json', modifiedAt: now + 1000 }
            ]);

            mockProvider.readFile.mockImplementation(() => JSON.stringify({
                lastModified: now,
                data: testData.personas.valid
            }));

            const changes = await getChangedPersonas(new Date(now));
            expect(changes).toHaveLength(1);
            expect(changes[0].id).toBe('new');
        });
    });
});