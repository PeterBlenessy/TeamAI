import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncConversation, getConversation, getChangedConversations } from '@/composables/cloudSync/conversations';
import { cloudSyncService } from '@/services/cloudSyncService';
import { createMockProvider, testData } from './test-utils';

vi.mock('@/services/cloudSyncService');

describe('Conversations Handler', () => {
    const mockProvider = createMockProvider();

    beforeEach(() => {
        vi.clearAllMocks();
        cloudSyncService.getProvider = vi.fn().mockReturnValue(mockProvider);
    });

    describe('syncConversation', () => {
        it('validates conversation data', async () => {
            const invalidData = { messages: 'not-an-array' };
            await expect(syncConversation('test-id', invalidData))
                .rejects.toThrow('Conversation must have history object');
        });

        it('successfully syncs valid conversation', async () => {
            await syncConversation('test-id', testData.conversations.valid);
            expect(mockProvider.writeFile).toHaveBeenCalledWith(
                '/mock/container/conversations/test-id.json',
                expect.any(String)
            );
        });
    });

    describe('getConversation', () => {
        it('returns null for non-existent conversation', async () => {
            mockProvider.readFile.mockRejectedValue(new Error('no such file'));
            const result = await getConversation('missing-id');
            expect(result).toBeNull();
        });

        it('returns conversation data when found', async () => {
            const mockStoredData = {
                lastModified: Date.now(),
                data: testData.conversations.valid
            };
            mockProvider.readFile.mockResolvedValue(JSON.stringify(mockStoredData));

            const result = await getConversation('test-id');
            expect(result).toEqual(testData.conversations.valid);
        });
    });

    describe('getChangedConversations', () => {
        it('filters conversations by date when since is provided', async () => {
            const now = Date.now();
            mockProvider.listFiles.mockResolvedValue([
                { name: 'old.json', modifiedAt: now - 1000 },
                { name: 'new.json', modifiedAt: now + 1000 }
            ]);

            mockProvider.readFile.mockImplementation(() => JSON.stringify({
                lastModified: now,
                data: testData.conversations.valid
            }));

            const changes = await getChangedConversations(new Date(now));
            expect(changes).toHaveLength(1);
            expect(changes[0].id).toBe('new');
        });
    });
});